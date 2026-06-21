import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createMemoryDb } from "../testing.js";
import type { Db, SqliteDatabase } from "../client.js";
import { AiOutputRepository } from "./ai-output-repository.js";
import { ItemRepository } from "./item-repository.js";

let sqlite: SqliteDatabase;
let db: Db;
let aiRepo: AiOutputRepository;
let itemRepo: ItemRepository;

beforeEach(() => {
  ({ sqlite, db } = createMemoryDb());
  aiRepo = new AiOutputRepository(db);
  itemRepo = new ItemRepository(db);
});

afterEach(() => {
  sqlite.close();
});

function makeItem() {
  return itemRepo.create({ type: "webpage", title: "T", url: "https://x.test" });
}

describe("AiOutputRepository", () => {
  it("creates an output and returns the latest of a kind for an item", () => {
    const item = makeItem();
    const first = aiRepo.create({
      itemId: item.id,
      type: "summary",
      provider: "openai-compatible",
      model: "gpt",
      inputHash: "h1",
      output: JSON.stringify({ summary: "first" }),
    });
    expect(first.id).toMatch(/^ao_/);

    const second = aiRepo.create({
      itemId: item.id,
      type: "summary",
      provider: "openai-compatible",
      model: "gpt",
      inputHash: "h2",
      output: JSON.stringify({ summary: "second" }),
    });

    const latest = aiRepo.findLatestByItem(item.id, "summary");
    expect(latest?.id).toBe(second.id);
    expect(JSON.parse(latest!.output)).toEqual({ summary: "second" });
  });

  it("returns null when no output of that kind exists", () => {
    const item = makeItem();
    expect(aiRepo.findLatestByItem(item.id, "summary")).toBeNull();
  });

  it("lists and deletes embeddings by item and type (rebuild path)", () => {
    const item = makeItem();
    for (let i = 0; i < 3; i++) {
      aiRepo.create({
        itemId: item.id,
        type: "embedding",
        provider: "ollama",
        model: "nomic",
        inputHash: `c${i}`,
        output: JSON.stringify({ chunkId: `chunk_${i}`, vector: [i, i] }),
      });
    }
    aiRepo.create({
      itemId: item.id,
      type: "summary",
      provider: "ollama",
      model: "x",
      inputHash: "s",
      output: "{}",
    });

    expect(aiRepo.listByItemAndType(item.id, "embedding").length).toBe(3);

    aiRepo.deleteByItemAndType(item.id, "embedding");
    expect(aiRepo.listByItemAndType(item.id, "embedding")).toEqual([]);
    // Other output types are untouched.
    expect(aiRepo.findLatestByItem(item.id, "summary")).not.toBeNull();
  });
});

describe("ItemRepository AI summary fields", () => {
  it("applyAiSummary sets summary/oneSentence and ai_status=done", () => {
    const item = makeItem();
    expect(item.aiStatus).toBe("none");
    const updated = itemRepo.applyAiSummary(item.id, {
      summary: "A concise summary.",
      oneSentence: "One line.",
    });
    expect(updated.summary).toBe("A concise summary.");
    expect(updated.oneSentence).toBe("One line.");
    expect(updated.aiStatus).toBe("done");
  });

  it("setAiStatus updates only the status", () => {
    const item = makeItem();
    itemRepo.setAiStatus(item.id, "pending");
    expect(itemRepo.findById(item.id)?.aiStatus).toBe("pending");
    itemRepo.setAiStatus(item.id, "failed");
    expect(itemRepo.findById(item.id)?.aiStatus).toBe("failed");
  });
});
