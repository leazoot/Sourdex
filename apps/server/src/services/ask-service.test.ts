import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { AIProviderError, type ProviderConfig, type SecretStore } from "@sourdex/core";
import {
  AiOutputRepository,
  CaptureRepository,
  ChunkRepository,
  createMemoryDb,
  ItemRepository,
  ProviderConfigRepository,
  SearchRepository,
  TagRepository,
  type SqliteDatabase,
} from "@sourdex/db";
import { LocalStorage } from "../infrastructure/storage/local-storage.js";
import { EmbeddingService } from "./embedding-service.js";
import { SemanticSearchService } from "./semantic-search-service.js";
import { AskService } from "./ask-service.js";

class MemorySecretStore implements SecretStore {
  async get() {
    return "k";
  }
  async set() {}
  async delete() {}
  async has() {
    return true;
  }
}

let sqlite: SqliteDatabase;
let itemRepo: ItemRepository;
let chunkRepo: ChunkRepository;
let aiOutputRepo: AiOutputRepository;
let searchRepo: SearchRepository;
let tagRepo: TagRepository;
let providerRepo: ProviderConfigRepository;
let semantic: SemanticSearchService;

/** Seed an item with one indexed chunk + its embedding. Returns {itemId, chunkId}. */
function seed(opts: { title: string; text: string; vector: number[]; tags?: string[] }) {
  const item = itemRepo.create({
    type: "webpage",
    title: opts.title,
    url: `https://x/${opts.title}`,
  });
  const [chunk] = chunkRepo.replaceForItem(item.id, [{ chunkIndex: 0, text: opts.text }]);
  aiOutputRepo.create({
    itemId: item.id,
    type: "embedding",
    provider: "ollama",
    model: "nomic",
    inputHash: opts.title,
    output: JSON.stringify({ chunkId: chunk!.id, vector: opts.vector }),
  });
  for (const name of opts.tags ?? []) {
    const tag = tagRepo.upsert(name, "manual");
    tagRepo.attachToItem(item.id, tag.id, { source: "manual" });
  }
  searchRepo.index({ itemId: item.id, title: opts.title, plainText: opts.text });
  return { itemId: item.id, chunkId: chunk!.id };
}

/** AskService whose chat returns `chatContent`; embedding query points at [1,0]. */
function makeAsk(chatContent: string | (() => never)) {
  const embeddingService = new EmbeddingService({
    providerConfigRepo: providerRepo,
    secrets: new MemorySecretStore(),
    chunkRepo,
    aiOutputRepo,
    itemRepo,
    captureRepo: new CaptureRepository(createMemoryDb().db),
    storage: new LocalStorage("/tmp/unused-ask"),
    createProvider: () => ({
      async embed() {
        return { vectors: [[1, 0]], model: "nomic" };
      },
    }),
  });
  semantic = new SemanticSearchService({ embeddingService, searchRepo, chunkRepo });
  return new AskService({
    providerConfigRepo: providerRepo,
    secrets: new MemorySecretStore(),
    searchRepo,
    semanticSearchService: semantic,
    chunkRepo,
    itemRepo,
    tagRepo,
    aiOutputRepo,
    createProvider: (_c: ProviderConfig) => ({
      async chat() {
        if (typeof chatContent === "function") return chatContent();
        return { content: chatContent, model: "gpt-test" };
      },
    }),
  });
}

beforeEach(() => {
  const mem = createMemoryDb();
  sqlite = mem.sqlite;
  itemRepo = new ItemRepository(mem.db);
  chunkRepo = new ChunkRepository(mem.db);
  aiOutputRepo = new AiOutputRepository(mem.db);
  searchRepo = new SearchRepository(mem.db);
  tagRepo = new TagRepository(mem.db);
  providerRepo = new ProviderConfigRepository(mem.db);
  providerRepo.create({
    name: "P",
    type: "ollama",
    baseUrl: "http://127.0.0.1:11434",
    chatModel: "llama3",
    embeddingModel: "nomic",
    enabled: true,
  });
});

afterEach(() => sqlite.close());

describe("AskService", () => {
  it("answers with citations validated against retrieved chunks", async () => {
    const { itemId, chunkId } = seed({
      title: "CRDTs",
      text: "CRDTs merge deterministically across replicas.",
      vector: [1, 0],
    });
    const svc = makeAsk(
      JSON.stringify({
        answer: "They merge deterministically [1].",
        citations: [{ n: 1, quote: "CRDTs merge deterministically" }],
        confidence: "high",
      }),
    );

    const res = await svc.ask("How do CRDTs merge?");
    expect(res.answer).toContain("[1]");
    expect(res.confidence).toBe("high");
    expect(res.citations).toHaveLength(1);
    expect(res.citations[0]).toMatchObject({ n: 1, itemId, chunkId });
  });

  it("returns insufficient-evidence (no citations) when the model cites nothing valid", async () => {
    seed({ title: "CRDTs", text: "CRDTs merge deterministically.", vector: [1, 0] });
    const svc = makeAsk(
      JSON.stringify({
        answer: "Some confident but uncited claim.",
        citations: [{ n: 9, quote: "nope" }],
        confidence: "high",
      }),
    );

    const res = await svc.ask("How do CRDTs merge?");
    expect(res.citations).toEqual([]);
    expect(res.confidence).toBe("low");
    expect(res.answer).not.toContain("uncited claim");
  });

  it("returns insufficient evidence without calling the model when nothing is retrieved", async () => {
    // No items seeded → no evidence.
    const svc = makeAsk(() => {
      throw new Error("chat must not be called");
    });
    const res = await svc.ask("anything?");
    expect(res.citations).toEqual([]);
    expect(res.confidence).toBe("low");
  });

  it("honors itemIds scope (excludes out-of-scope evidence)", async () => {
    const inScope = seed({
      title: "CRDTs",
      text: "CRDTs merge deterministically.",
      vector: [1, 0],
    });
    seed({ title: "Other", text: "CRDTs are also discussed here.", vector: [1, 0] });

    const svc = makeAsk(
      JSON.stringify({
        answer: "Yes [1].",
        citations: [{ n: 1, quote: "CRDTs merge deterministically" }],
        confidence: "medium",
      }),
    );
    const res = await svc.ask("CRDTs?", { itemIds: [inScope.itemId] });
    expect(res.citations.every((c) => c.itemId === inScope.itemId)).toBe(true);
  });

  it("propagates provider errors (surfaced as 502 upstream)", async () => {
    seed({ title: "CRDTs", text: "CRDTs merge deterministically.", vector: [1, 0] });
    const svc = makeAsk(() => {
      throw new AIProviderError("upstream down");
    });
    await expect(svc.ask("How do CRDTs merge?")).rejects.toBeInstanceOf(AIProviderError);
  });
});
