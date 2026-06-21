import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createMemoryDb } from "../testing.js";
import type { Db, SqliteDatabase } from "../client.js";
import { ItemRepository } from "./item-repository.js";
import { TagRepository, normalizeTagName } from "./tag-repository.js";

let sqlite: SqliteDatabase;
let db: Db;
let tagRepo: TagRepository;
let itemRepo: ItemRepository;
let itemId: string;

beforeEach(() => {
  ({ sqlite, db } = createMemoryDb());
  tagRepo = new TagRepository(db);
  itemRepo = new ItemRepository(db);
  itemId = itemRepo.create({ type: "webpage", title: "Host" }).id;
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

describe("TagRepository management (STAGE-19)", () => {
  it("lists all tags with non-deleted item counts, ordered by count desc", () => {
    const other = itemRepo.create({ type: "webpage", title: "Other" }).id;
    const deleted = itemRepo.create({ type: "webpage", title: "Gone" }).id;
    const popular = tagRepo.upsert("popular");
    const rare = tagRepo.upsert("rare");
    tagRepo.upsert("empty");
    tagRepo.attachToItem(itemId, popular.id);
    tagRepo.attachToItem(other, popular.id);
    tagRepo.attachToItem(itemId, rare.id);
    tagRepo.attachToItem(deleted, rare.id);
    itemRepo.softDelete(deleted);

    const counts = tagRepo.listAllWithCounts();
    const byName = Object.fromEntries(counts.map((t) => [t.name, t.count]));
    expect(byName.popular).toBe(2);
    expect(byName.rare).toBe(1); // deleted item excluded
    expect(byName.empty).toBe(0);
    expect(counts[0]?.name).toBe("popular"); // ordered by count desc
  });

  it("renames a tag (name + normalized name)", () => {
    const tag = tagRepo.upsert("oldname");
    const renamed = tagRepo.rename(tag.id, "New Name");
    expect(renamed?.name).toBe("New Name");
    expect(renamed?.normalizedName).toBe("new name");
    expect(tagRepo.findById(tag.id)?.name).toBe("New Name");
  });

  it("merges a tag into another, re-pointing associations and dropping the source", () => {
    const other = itemRepo.create({ type: "webpage", title: "Other" }).id;
    const source = tagRepo.upsert("sqlite");
    const target = tagRepo.upsert("databases");
    tagRepo.attachToItem(itemId, source.id);
    tagRepo.attachToItem(other, source.id);
    tagRepo.attachToItem(itemId, target.id); // already on target — dedup on merge

    const affected = tagRepo.mergeInto(source.id, target.id);
    expect(affected.sort()).toEqual([itemId, other].sort());
    expect(tagRepo.findById(source.id)).toBeNull();
    expect(tagRepo.listByItem(itemId).map((t) => t.name)).toEqual(["databases"]);
    expect(tagRepo.listByItem(other).map((t) => t.name)).toEqual(["databases"]);
  });

  it("deletes a tag and its associations, returning affected items", () => {
    const tag = tagRepo.upsert("temp");
    tagRepo.attachToItem(itemId, tag.id);
    const affected = tagRepo.deleteTag(tag.id);
    expect(affected).toEqual([itemId]);
    expect(tagRepo.findById(tag.id)).toBeNull();
    expect(tagRepo.listByItem(itemId)).toHaveLength(0);
  });
});
