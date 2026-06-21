import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createMemoryDb } from "./testing.js";
import type { Db, SqliteDatabase } from "./client.js";
import { ItemRepository } from "./repositories/item-repository.js";
import { SearchRepository } from "./repositories/search-repository.js";
import { seedDevData } from "./seed.js";

let sqlite: SqliteDatabase;
let db: Db;

beforeEach(() => {
  ({ sqlite, db } = createMemoryDb());
});

afterEach(() => {
  sqlite.close();
});

describe("seedDevData", () => {
  it("inserts example items that are listable and searchable", () => {
    const { itemIds } = seedDevData(db);
    expect(itemIds.length).toBeGreaterThan(0);

    const list = new ItemRepository(db).list({});
    expect(list.total).toBe(itemIds.length);

    const hits = new SearchRepository(db).search("sqlite");
    expect(hits.length).toBeGreaterThan(0);
  });
});
