import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createMemoryDb } from "../testing.js";
import type { Db, SqliteDatabase } from "../client.js";
import { SearchRepository } from "./search-repository.js";

let sqlite: SqliteDatabase;
let db: Db;
let search: SearchRepository;

const COUNT = 10_000;
const TOPICS = ["sqlite", "search", "performance", "indexing", "localfirst"];

beforeEach(() => {
  ({ sqlite, db } = createMemoryDb());
  search = new SearchRepository(db);

  // Bulk-seed 10k items + their FTS rows in one transaction (PRD §18.2 perf check).
  const insItem = sqlite.prepare(
    "INSERT INTO items (id, type, status, title, saved_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)",
  );
  const insFts = sqlite.prepare(
    "INSERT INTO items_fts (item_id, title, plain_text, summary, tags) VALUES (?, ?, ?, ?, ?)",
  );
  const seed = sqlite.transaction(() => {
    for (let i = 0; i < COUNT; i++) {
      const id = `item_${i}`;
      const topic = TOPICS[i % TOPICS.length];
      const iso = `2026-01-01T00:00:${String(i % 60).padStart(2, "0")}.000Z`;
      insItem.run(id, "webpage", "inbox", `Document ${i} about ${topic}`, iso, iso);
      insFts.run(
        id,
        `Document ${i} about ${topic}`,
        `Article number ${i} discusses ${topic} in depth with practical examples and notes.`,
        "",
        "",
      );
    }
  });
  seed();
});

afterEach(() => {
  sqlite.close();
});

describe("SearchRepository performance (PRD §18.2)", () => {
  it("keyword-searches 10k items in under 500ms", () => {
    // Warm up (first query compiles the statement) before timing.
    search.queryItems('"sqlite"', {}, { limit: 20 });

    const start = performance.now();
    const rows = search.queryItems('"sqlite"', {}, { limit: 20 });
    const elapsed = performance.now() - start;

    expect(rows.length).toBe(20);
    expect(elapsed).toBeLessThan(500);
  });
});
