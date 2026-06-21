import { HIGHLIGHT_OPEN } from "@sourdex/core";
import { sql } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createMemoryDb } from "../testing.js";
import type { Db, SqliteDatabase } from "../client.js";
import { ItemRepository } from "./item-repository.js";
import { SearchRepository } from "./search-repository.js";

let sqlite: SqliteDatabase;
let db: Db;
let search: SearchRepository;
let items: ItemRepository;

beforeEach(() => {
  ({ sqlite, db } = createMemoryDb());
  search = new SearchRepository(db);
  items = new ItemRepository(db);
});

afterEach(() => {
  sqlite.close();
});

describe("SearchRepository", () => {
  it("indexes items and returns keyword matches with a snippet", () => {
    const a = items.create({ type: "webpage", title: "SQLite FTS5 guide" });
    const b = items.create({ type: "webpage", title: "Unrelated cooking post" });
    search.index({
      itemId: a.id,
      title: "SQLite FTS5 guide",
      plainText: "how to use sqlite full text search",
    });
    search.index({
      itemId: b.id,
      title: "Unrelated cooking post",
      plainText: "a recipe for bread",
    });

    const hits = search.search("sqlite");
    expect(hits).toHaveLength(1);
    expect(hits[0]?.itemId).toBe(a.id);
    expect(hits[0]?.snippet).toContain("[sqlite]");
  });

  it("re-indexing replaces previous content (no duplicates)", () => {
    const a = items.create({ type: "webpage", title: "v1" });
    search.index({ itemId: a.id, title: "v1", plainText: "alpha" });
    search.index({ itemId: a.id, title: "v2", plainText: "beta" });

    expect(search.search("alpha")).toHaveLength(0);
    expect(search.search("beta")).toHaveLength(1);
  });

  it("removes an item from the index", () => {
    const a = items.create({ type: "webpage", title: "temp" });
    search.index({ itemId: a.id, title: "temp", plainText: "ephemeral content" });
    search.removeFromIndex(a.id);
    expect(search.search("ephemeral")).toHaveLength(0);
  });
});

describe("SearchRepository.queryItems (TASK-040)", () => {
  it("reports matchedFields and returns a highlighted snippet for content hits", () => {
    const a = items.create({ type: "webpage", title: "Alpha Title" });
    search.index({ itemId: a.id, title: "Alpha Title", plainText: "the betakeyword appears here" });

    const byContent = search.queryItems('"betakeyword"');
    expect(byContent).toHaveLength(1);
    expect(byContent[0]?.itemId).toBe(a.id);
    expect(byContent[0]?.contentMatch).toBeTruthy();
    expect(byContent[0]?.titleMatch).toBeFalsy();
    expect(byContent[0]?.snippet).toContain(`${HIGHLIGHT_OPEN}betakeyword`);
    expect(typeof byContent[0]?.bm25).toBe("number");

    const byTitle = search.queryItems('"alpha"');
    expect(byTitle[0]?.titleMatch).toBeTruthy();
    expect(byTitle[0]?.contentMatch).toBeFalsy();
  });

  it("applies the type filter and excludes soft-deleted items", () => {
    const web = items.create({ type: "webpage", title: "web" });
    const pdf = items.create({ type: "pdf", title: "pdf" });
    search.index({ itemId: web.id, title: "web", plainText: "gammaword content" });
    search.index({ itemId: pdf.id, title: "pdf", plainText: "gammaword content" });

    expect(search.queryItems('"gammaword"')).toHaveLength(2);
    expect(search.queryItems('"gammaword"', { type: "webpage" })).toHaveLength(1);

    db.run(sql`UPDATE items SET status = 'deleted' WHERE id = ${web.id}`);
    const rows = search.queryItems('"gammaword"');
    expect(rows).toHaveLength(1);
    expect(rows[0]?.itemId).toBe(pdf.id);
  });

  it("orders by saved time when sort=newest/oldest", () => {
    const older = items.create({ type: "webpage", title: "older" });
    const newer = items.create({ type: "webpage", title: "newer" });
    search.index({ itemId: older.id, title: "older", plainText: "deltaword here" });
    search.index({ itemId: newer.id, title: "newer", plainText: "deltaword here" });
    db.run(sql`UPDATE items SET saved_at = '2020-01-01T00:00:00.000Z' WHERE id = ${older.id}`);
    db.run(sql`UPDATE items SET saved_at = '2024-01-01T00:00:00.000Z' WHERE id = ${newer.id}`);

    expect(search.queryItems('"deltaword"', {}, { sort: "newest" })[0]?.itemId).toBe(newer.id);
    expect(search.queryItems('"deltaword"', {}, { sort: "oldest" })[0]?.itemId).toBe(older.id);
  });
});
