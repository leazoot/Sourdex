import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { NotFoundError } from "@sourdex/core";
import { createMemoryDb } from "../testing.js";
import type { Db } from "../client.js";
import type { SqliteDatabase } from "../client.js";
import { ItemRepository } from "./item-repository.js";
import { TagRepository } from "./tag-repository.js";

let sqlite: SqliteDatabase;
let db: Db;
let repo: ItemRepository;

beforeEach(() => {
  ({ sqlite, db } = createMemoryDb());
  repo = new ItemRepository(db);
});

afterEach(() => {
  sqlite.close();
});

describe("ItemRepository", () => {
  it("creates and finds an item with defaults", () => {
    const created = repo.create({ type: "webpage", title: "Hello", url: "https://example.com" });
    expect(created.id).toMatch(/^item_/);
    expect(created.status).toBe("inbox");
    expect(created.aiStatus).toBe("none");
    expect(created.wordCount).toBe(0);

    const found = repo.findById(created.id);
    expect(found?.title).toBe("Hello");
  });

  it("returns null for a missing id", () => {
    expect(repo.findById("item_missing")).toBeNull();
  });

  it("updates editable fields and bumps updatedAt", () => {
    const created = repo.create({ type: "webpage", title: "Old" });
    const updated = repo.update(created.id, { title: "New", status: "read" });
    expect(updated.title).toBe("New");
    expect(updated.status).toBe("read");
  });

  it("throws NotFoundError when updating a missing item", () => {
    expect(() => repo.update("item_missing", { title: "x" })).toThrow(NotFoundError);
  });

  it("soft-deletes (status=deleted) and excludes from default listing", () => {
    const created = repo.create({ type: "webpage", title: "Bye" });
    repo.softDelete(created.id);
    expect(repo.findById(created.id)?.status).toBe("deleted");

    const list = repo.list({});
    expect(list.items.find((i) => i.id === created.id)).toBeUndefined();
  });

  it("finds by source hash but ignores deleted items", () => {
    const created = repo.create({ type: "webpage", title: "Hashed", sourceHash: "abc123" });
    expect(repo.findBySourceHash("abc123")?.id).toBe(created.id);
    repo.softDelete(created.id);
    expect(repo.findBySourceHash("abc123")).toBeNull();
  });

  it("filters by type and domain and paginates", () => {
    repo.create({ type: "webpage", title: "A", domain: "a.com" });
    repo.create({ type: "webpage", title: "B", domain: "b.com" });
    repo.create({ type: "selection", title: "C", domain: "a.com" });

    expect(repo.list({ type: "webpage" }).total).toBe(2);
    expect(repo.list({ domain: "a.com" }).total).toBe(2);

    const page = repo.list({ pageSize: 2, page: 1 });
    expect(page.items).toHaveLength(2);
    expect(page.total).toBe(3);
  });

  it("filters by tag", () => {
    const tagRepo = new TagRepository(db);
    const item = repo.create({ type: "webpage", title: "Tagged" });
    repo.create({ type: "webpage", title: "Untagged" });
    const tag = tagRepo.upsert("AI Tools");
    tagRepo.attachToItem(item.id, tag.id);

    const result = repo.list({ tag: "ai tools" });
    expect(result.total).toBe(1);
    expect(result.items[0]?.id).toBe(item.id);
  });
});
