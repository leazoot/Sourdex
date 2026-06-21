import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createMemoryDb } from "../testing.js";
import type { SqliteDatabase } from "../client.js";
import { ChunkRepository } from "./chunk-repository.js";
import { ItemRepository } from "./item-repository.js";

let sqlite: SqliteDatabase;
let chunkRepo: ChunkRepository;
let itemRepo: ItemRepository;
let itemId: string;

beforeEach(() => {
  const mem = createMemoryDb();
  sqlite = mem.sqlite;
  chunkRepo = new ChunkRepository(mem.db);
  itemRepo = new ItemRepository(mem.db);
  itemId = itemRepo.create({ type: "webpage", title: "T", url: "https://x.test" }).id;
});

afterEach(() => sqlite.close());

describe("ChunkRepository", () => {
  it("replaces chunks for an item and lists them by index", () => {
    chunkRepo.replaceForItem(itemId, [
      { chunkIndex: 0, text: "first", startOffset: 0, endOffset: 5, tokenCount: 1 },
      { chunkIndex: 1, text: "second", startOffset: 5, endOffset: 11, tokenCount: 1 },
    ]);

    const list = chunkRepo.listByItem(itemId);
    expect(list.map((c) => c.text)).toEqual(["first", "second"]);
    expect(list[0].startOffset).toBe(0);
    expect(chunkRepo.findById(list[1].id)?.text).toBe("second");
  });

  it("is idempotent: replaceForItem clears prior chunks", () => {
    chunkRepo.replaceForItem(itemId, [{ chunkIndex: 0, text: "old" }]);
    chunkRepo.replaceForItem(itemId, [
      { chunkIndex: 0, text: "new-a" },
      { chunkIndex: 1, text: "new-b" },
    ]);
    expect(chunkRepo.listByItem(itemId).map((c) => c.text)).toEqual(["new-a", "new-b"]);
  });

  it("deleteByItem removes all chunks; empty replace yields none", () => {
    chunkRepo.replaceForItem(itemId, [{ chunkIndex: 0, text: "x" }]);
    chunkRepo.deleteByItem(itemId);
    expect(chunkRepo.listByItem(itemId)).toEqual([]);
    expect(chunkRepo.replaceForItem(itemId, [])).toEqual([]);
  });
});
