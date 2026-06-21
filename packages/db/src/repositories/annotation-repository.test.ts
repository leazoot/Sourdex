import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createMemoryDb } from "../testing.js";
import type { SqliteDatabase } from "../client.js";
import { AnnotationRepository } from "./annotation-repository.js";
import { ItemRepository } from "./item-repository.js";

let sqlite: SqliteDatabase;
let annoRepo: AnnotationRepository;
let itemRepo: ItemRepository;
let itemId: string;

beforeEach(() => {
  const mem = createMemoryDb();
  sqlite = mem.sqlite;
  annoRepo = new AnnotationRepository(mem.db);
  itemRepo = new ItemRepository(mem.db);
  itemId = itemRepo.create({ type: "webpage", title: "T", url: "https://x.test" }).id;
});

afterEach(() => sqlite.close());

describe("AnnotationRepository", () => {
  it("creates a highlight (with optional note/color) and lists it by item", () => {
    const a = annoRepo.create({
      itemId,
      selectedText: "local-first software",
      note: "key idea",
      color: "amber",
    });
    expect(a.id).toMatch(/^anno_/);
    expect(a.selectedText).toBe("local-first software");

    const list = annoRepo.listByItem(itemId);
    expect(list).toHaveLength(1);
    expect(list[0]?.note).toBe("key idea");
    expect(annoRepo.findById(a.id)?.color).toBe("amber");
  });

  it("updates note/color with tri-state (undefined keeps, null clears)", () => {
    const a = annoRepo.create({ itemId, selectedText: "x", note: "old", color: "amber" });
    const updated = annoRepo.update(a.id, { note: "new" });
    expect(updated?.note).toBe("new");
    expect(updated?.color).toBe("amber"); // untouched
    const cleared = annoRepo.update(a.id, { color: null });
    expect(cleared?.color).toBeNull();
    expect(cleared?.note).toBe("new"); // untouched
  });

  it("counts and deletes annotations", () => {
    annoRepo.create({ itemId, selectedText: "a" });
    const b = annoRepo.create({ itemId, selectedText: "b" });
    expect(annoRepo.countByItem(itemId)).toBe(2);
    expect(annoRepo.delete(b.id)).toBe(true);
    expect(annoRepo.delete(b.id)).toBe(false); // already gone
    expect(annoRepo.countByItem(itemId)).toBe(1);
  });
});
