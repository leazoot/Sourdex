import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { AIProviderError, type ProviderConfig, type SecretStore } from "@sourdex/core";
import {
  AiOutputRepository,
  CaptureRepository,
  createMemoryDb,
  ItemRepository,
  ProviderConfigRepository,
  SearchRepository,
  TagRepository,
  type SqliteDatabase,
} from "@sourdex/db";
import { LocalStorage } from "../infrastructure/storage/local-storage.js";
import { SummaryService } from "./summary-service.js";

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
let aiOutputRepo: AiOutputRepository;
let searchRepo: SearchRepository;
let providerRepo: ProviderConfigRepository;
let secrets: MemorySecretStore;
let storage: LocalStorage;

beforeEach(() => {
  const mem = createMemoryDb();
  sqlite = mem.sqlite;
  root = mkdtempSync(join(tmpdir(), "sourdex-summary-"));
  itemRepo = new ItemRepository(mem.db);
  captureRepo = new CaptureRepository(mem.db);
  aiOutputRepo = new AiOutputRepository(mem.db);
  searchRepo = new SearchRepository(mem.db);
  providerRepo = new ProviderConfigRepository(mem.db);
  secrets = new MemorySecretStore();
  storage = new LocalStorage(root);
});

afterEach(() => {
  sqlite.close();
  rmSync(root, { recursive: true, force: true });
});

/** Seed an item with extracted text on disk and (optionally) an enabled provider. */
async function seed(opts: { enabled?: boolean } = {}) {
  const item = itemRepo.create({ type: "webpage", title: "SQLite FTS", url: "https://x.test" });
  const textPath = await storage.write(`files/text/${item.id}.txt`, "Full text about FTS search.");
  captureRepo.create({ itemId: item.id, originalTextPath: textPath, extractionStatus: "success" });
  if (opts.enabled) {
    const cfg = providerRepo.create({
      name: "P",
      type: "openai-compatible",
      baseUrl: "https://x",
      enabled: true,
    });
    await secrets.set(cfg.id, "sk-key");
  }
  return item;
}

function service(chat: () => Promise<{ content: string; model: string }>) {
  return new SummaryService({
    providerConfigRepo: providerRepo,
    secrets,
    aiOutputRepo,
    itemRepo,
    captureRepo,
    tagRepo: new TagRepository(createMemoryDb().db), // tags unused here
    searchRepo,
    storage,
    createProvider: (_c: ProviderConfig) => ({ chat }),
  });
}

const summaryJson = JSON.stringify({
  one_sentence: "About FTS.",
  summary: "A summary of full text search.",
  key_points: ["fts5"],
  suggested_tags: ["sqlite"],
});

describe("SummaryService", () => {
  it("writes ai_outputs + item summary and indexes the summary on success", async () => {
    const item = await seed({ enabled: true });
    const svc = service(async () => ({ content: summaryJson, model: "gpt-test" }));

    await svc.summarizeItem(item.id);

    const updated = itemRepo.findById(item.id);
    expect(updated?.aiStatus).toBe("done");
    expect(updated?.summary).toBe("A summary of full text search.");
    expect(updated?.oneSentence).toBe("About FTS.");

    const output = aiOutputRepo.findLatestByItem(item.id, "summary");
    expect(output?.model).toBe("gpt-test");
    expect(JSON.parse(output!.output).keyPoints).toEqual(["fts5"]);

    // The summary text is now searchable.
    const hits = searchRepo.search("full text search");
    expect(hits.some((h) => h.itemId === item.id)).toBe(true);
  });

  it("marks ai_status=failed without throwing on provider error", async () => {
    const item = await seed({ enabled: true });
    const svc = service(async () => {
      throw new AIProviderError("upstream down");
    });
    await expect(svc.summarizeItem(item.id)).resolves.toBeUndefined();
    expect(itemRepo.findById(item.id)?.aiStatus).toBe("failed");
  });

  it("marks ai_status=failed on malformed (non-JSON) model output", async () => {
    const item = await seed({ enabled: true });
    const svc = service(async () => ({ content: "not json", model: "m" }));
    await svc.summarizeItem(item.id);
    expect(itemRepo.findById(item.id)?.aiStatus).toBe("failed");
  });

  it("does nothing destructive when no provider is enabled (AI off)", async () => {
    const item = await seed({ enabled: false });
    const svc = service(async () => ({ content: summaryJson, model: "m" }));
    await svc.summarizeItem(item.id);
    const updated = itemRepo.findById(item.id);
    expect(updated?.aiStatus).toBe("none");
    expect(updated?.summary).toBeNull();
    expect(aiOutputRepo.findLatestByItem(item.id, "summary")).toBeNull();
  });
});
