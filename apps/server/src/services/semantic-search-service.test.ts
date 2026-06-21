import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { ProviderConfig, SecretStore } from "@sourdex/core";
import {
  AiOutputRepository,
  CaptureRepository,
  ChunkRepository,
  createMemoryDb,
  ItemRepository,
  ProviderConfigRepository,
  SearchRepository,
  type SqliteDatabase,
} from "@sourdex/db";
import { LocalStorage } from "../infrastructure/storage/local-storage.js";
import { EmbeddingService } from "./embedding-service.js";
import { SemanticSearchService } from "./semantic-search-service.js";

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
let providerRepo: ProviderConfigRepository;
let svc: SemanticSearchService;

/** Seed an item with one chunk and a stored embedding vector. */
function seedItem(title: string, vector: number[]): string {
  const item = itemRepo.create({ type: "webpage", title, url: `https://x/${title}` });
  const [chunk] = chunkRepo.replaceForItem(item.id, [
    { chunkIndex: 0, text: `passage about ${title}` },
  ]);
  aiOutputRepo.create({
    itemId: item.id,
    type: "embedding",
    provider: "ollama",
    model: "nomic",
    inputHash: title,
    output: JSON.stringify({ chunkId: chunk.id, vector }),
  });
  return item.id;
}

beforeEach(() => {
  const mem = createMemoryDb();
  sqlite = mem.sqlite;
  itemRepo = new ItemRepository(mem.db);
  chunkRepo = new ChunkRepository(mem.db);
  aiOutputRepo = new AiOutputRepository(mem.db);
  searchRepo = new SearchRepository(mem.db);
  providerRepo = new ProviderConfigRepository(mem.db);
  providerRepo.create({
    name: "P",
    type: "ollama",
    baseUrl: "http://127.0.0.1:11434",
    embeddingModel: "nomic",
    enabled: true,
  });

  const embeddingService = new EmbeddingService({
    providerConfigRepo: providerRepo,
    secrets: new MemorySecretStore(),
    chunkRepo,
    aiOutputRepo,
    itemRepo,
    captureRepo: new CaptureRepository(mem.db),
    storage: new LocalStorage("/tmp/unused-semantic"),
    // Query embeds to a fixed vector pointing at the "vectors" axis.
    createProvider: (_c: ProviderConfig) => ({
      async embed() {
        return { vectors: [[1, 0]], model: "nomic" };
      },
    }),
  });
  svc = new SemanticSearchService({ embeddingService, searchRepo, chunkRepo });
});

afterEach(() => sqlite.close());

describe("SemanticSearchService", () => {
  it("ranks by cosine similarity and returns a traceable chunk snippet", async () => {
    const near = seedItem("vectors", [1, 0]);
    seedItem("cooking", [0, 1]); // orthogonal → score 0 → excluded

    const hits = await svc.search("vector search");
    expect(hits.length).toBe(1);
    expect(hits[0].itemId).toBe(near);
    expect(hits[0].chunkId).toBeTruthy();
    expect(hits[0].snippet).toContain("vectors");
    expect(hits[0].score).toBeCloseTo(1);
  });

  it("excludes soft-deleted items", async () => {
    const deleted = seedItem("vectors", [1, 0]);
    itemRepo.update(deleted, { status: "deleted" });

    const hits = await svc.search("vector search");
    expect(hits).toEqual([]);
  });

  it("returns nothing when semantic is off (no enabled embedding provider)", async () => {
    seedItem("vectors", [1, 0]);
    const off = new SemanticSearchService({
      embeddingService: new EmbeddingService({
        providerConfigRepo: { list: () => [] },
        secrets: new MemorySecretStore(),
        chunkRepo,
        aiOutputRepo,
        itemRepo,
        captureRepo: new CaptureRepository(createMemoryDb().db),
        storage: new LocalStorage("/tmp/unused-semantic2"),
      }),
      searchRepo,
      chunkRepo,
    });
    expect(off.enabledProvider()).toBeNull();
    expect(await off.search("vector search")).toEqual([]);
  });
});
