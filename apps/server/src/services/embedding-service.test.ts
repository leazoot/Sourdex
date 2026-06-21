import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { AIProviderError, type EmbedInput, type SecretStore } from "@sourdex/core";
import {
  AiOutputRepository,
  CaptureRepository,
  ChunkRepository,
  createMemoryDb,
  ItemRepository,
  ProviderConfigRepository,
  type SqliteDatabase,
} from "@sourdex/db";
import { LocalStorage } from "../infrastructure/storage/local-storage.js";
import { EmbeddingService } from "./embedding-service.js";

class MemorySecretStore implements SecretStore {
  readonly map = new Map<string, string>();
  async get(k: string) {
    return this.map.get(k) ?? null;
  }
  async set(k: string, v: string) {
    this.map.set(k, v);
  }
  async delete(k: string) {
    this.map.delete(k);
  }
  async has(k: string) {
    return this.map.has(k);
  }
}

let sqlite: SqliteDatabase;
let root: string;
let itemRepo: ItemRepository;
let captureRepo: CaptureRepository;
let chunkRepo: ChunkRepository;
let aiOutputRepo: AiOutputRepository;
let providerRepo: ProviderConfigRepository;
let secrets: MemorySecretStore;
let storage: LocalStorage;

beforeEach(() => {
  const mem = createMemoryDb();
  sqlite = mem.sqlite;
  root = mkdtempSync(join(tmpdir(), "sourdex-embed-"));
  itemRepo = new ItemRepository(mem.db);
  captureRepo = new CaptureRepository(mem.db);
  chunkRepo = new ChunkRepository(mem.db);
  aiOutputRepo = new AiOutputRepository(mem.db);
  providerRepo = new ProviderConfigRepository(mem.db);
  secrets = new MemorySecretStore();
  storage = new LocalStorage(root);
});

afterEach(() => {
  sqlite.close();
  rmSync(root, { recursive: true, force: true });
});

async function seed(opts: { enabled?: boolean; embeddingModel?: string | null } = {}) {
  const item = itemRepo.create({ type: "webpage", title: "Vec", url: "https://x.test" });
  const textPath = await storage.write(
    `files/text/${item.id}.txt`,
    "Para one about vectors.\n\nPara two about search and indexing.",
  );
  captureRepo.create({ itemId: item.id, originalTextPath: textPath, extractionStatus: "success" });
  if (opts.enabled !== undefined) {
    const cfg = providerRepo.create({
      name: "P",
      type: "ollama",
      baseUrl: "http://127.0.0.1:11434",
      embeddingModel: opts.embeddingModel === undefined ? "nomic" : opts.embeddingModel,
      enabled: opts.enabled,
    });
    await secrets.set(cfg.id, "k");
  }
  return item;
}

function service(embed: (input: EmbedInput) => Promise<{ vectors: number[][]; model: string }>) {
  return new EmbeddingService({
    providerConfigRepo: providerRepo,
    secrets,
    chunkRepo,
    aiOutputRepo,
    itemRepo,
    captureRepo,
    storage,
    createProvider: () => ({ embed }),
  });
}

describe("EmbeddingService", () => {
  it("chunks the item and stores one embedding per chunk", async () => {
    const item = await seed({ enabled: true });
    const svc = service(async ({ input }) => ({
      vectors: input.map((_, i) => [i + 1, 0, 0]),
      model: "nomic",
    }));

    await svc.embedItem(item.id);

    const chunks = chunkRepo.listByItem(item.id);
    expect(chunks.length).toBeGreaterThan(0);
    const embeddings = aiOutputRepo.listByItemAndType(item.id, "embedding");
    expect(embeddings.length).toBe(chunks.length);
    const parsed = JSON.parse(embeddings[0].output);
    expect(parsed.chunkId).toBe(chunks[0].id);
    expect(Array.isArray(parsed.vector)).toBe(true);
  });

  it("rebuilds embeddings idempotently on re-run", async () => {
    const item = await seed({ enabled: true });
    const svc = service(async ({ input }) => ({
      vectors: input.map(() => [1, 0]),
      model: "nomic",
    }));
    await svc.embedItem(item.id);
    const first = aiOutputRepo.listByItemAndType(item.id, "embedding").length;
    await svc.embedItem(item.id);
    expect(aiOutputRepo.listByItemAndType(item.id, "embedding").length).toBe(first);
  });

  it("is a no-op when no enabled provider has an embedding model", async () => {
    const noModel = await seed({ enabled: true, embeddingModel: null });
    const svc = service(async () => ({ vectors: [[1]], model: "m" }));
    await svc.embedItem(noModel.id);
    expect(chunkRepo.listByItem(noModel.id)).toEqual([]);
    expect(aiOutputRepo.listByItemAndType(noModel.id, "embedding")).toEqual([]);
  });

  it("swallows provider errors without throwing (FTS unaffected)", async () => {
    const item = await seed({ enabled: true });
    const svc = service(async () => {
      throw new AIProviderError("embed endpoint down");
    });
    await expect(svc.embedItem(item.id)).resolves.toBeUndefined();
    expect(aiOutputRepo.listByItemAndType(item.id, "embedding")).toEqual([]);
  });
});
