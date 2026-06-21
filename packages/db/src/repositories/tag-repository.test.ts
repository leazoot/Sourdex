import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createMemoryDb } from "../testing.js";
import type { Db, SqliteDatabase } from "../client.js";
import { ItemRepository } from "./item-repository.js";
import { TagRepository, normalizeTagName } from "./tag-repository.js";

let sqlite: SqliteDatabase;
let db: Db;
let tagRepo: TagRepository;
let itemId: string;

beforeEach(() => {
  ({ sqlite, db } = createMemoryDb());
  tagRepo = new TagRepository(db);
  itemId = new ItemRepository(db).create({ type: "webpage", title: "Host" }).id;
});

afterEach(() => {
  sqlite.close();
});

describe("normalizeTagName", () => {
  it("lowercases, trims and collapses whitespace", () => {
    expect(normalizeTagName("  AI   Tools ")).toBe("ai tools");
  });
});

describe("TagRepository", () => {
  it("reuses an existing tag by normalized name", () => {
    const first = tagRepo.upsert("AI Tools");
    const second = tagRepo.upsert("ai   tools");
    expect(second.id).toBe(first.id);
  });

  it("attaches tags to an item idempotently and lists them", () => {
    const tag = tagRepo.upsert("research");
    tagRepo.attachToItem(itemId, tag.id);
    tagRepo.attachToItem(itemId, tag.id); // duplicate ignored
    const list = tagRepo.listByItem(itemId);
    expect(list).toHaveLength(1);
    expect(list[0]?.name).toBe("research");
  });

  it("detaches a tag from an item", () => {
    const tag = tagRepo.upsert("temp");
    tagRepo.attachToItem(itemId, tag.id);
    tagRepo.detachFromItem(itemId, tag.id);
    expect(tagRepo.listByItem(itemId)).toHaveLength(0);
  });
});
