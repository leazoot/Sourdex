import { afterEach, describe, expect, it } from "vitest";
import { createSqlite, type SqliteDatabase } from "./client.js";
import { runMigrations } from "./migrate.js";

let sqlite: SqliteDatabase | undefined;

afterEach(() => {
  sqlite?.close();
  sqlite = undefined;
});

function tableNames(db: SqliteDatabase): string[] {
  const rows = db
    .prepare("SELECT name FROM sqlite_master WHERE type IN ('table') ORDER BY name")
    .all() as Array<{ name: string }>;
  return rows.map((r) => r.name);
}

describe("runMigrations", () => {
  it("creates all PRD §12 tables and the FTS index from an empty database", () => {
    sqlite = createSqlite(":memory:");
    const ran = runMigrations(sqlite);
    expect(ran).toEqual(["0000_init", "0001_capture_content_kind"]);

    const names = tableNames(sqlite);
    for (const expected of [
      "items",
      "captures",
      "chunks",
      "tags",
      "item_tags",
      "annotations",
      "jobs",
      "ai_outputs",
      "provider_configs",
      "items_fts",
    ]) {
      expect(names).toContain(expected);
    }
  });

  it("is idempotent (second run applies nothing)", () => {
    sqlite = createSqlite(":memory:");
    runMigrations(sqlite);
    const second = runMigrations(sqlite);
    expect(second).toEqual([]);
  });

  it("adds captures.content_kind and backfills existing successful captures (0001)", () => {
    sqlite = createSqlite(":memory:");
    runMigrations(sqlite);
    // Simulate a database created before 0001: drop the column and its migration record.
    sqlite.exec("DELETE FROM _sourdex_migrations WHERE name = '0001_capture_content_kind'");
    sqlite.exec("ALTER TABLE captures DROP COLUMN content_kind");
    sqlite.exec(
      "INSERT INTO items (id, type, title, saved_at, updated_at) VALUES ('item_1','webpage','t','2026-01-01T00:00:00.000Z','2026-01-01T00:00:00.000Z')",
    );
    sqlite.exec(
      "INSERT INTO captures (id, item_id, extraction_status, created_at) VALUES ('cap_ok','item_1','success','2026-01-01T00:00:00.000Z'),('cap_bad','item_1','failed','2026-01-01T00:00:00.000Z')",
    );

    const ran = runMigrations(sqlite);
    expect(ran).toEqual(["0001_capture_content_kind"]);

    const rows = sqlite
      .prepare("SELECT id, content_kind FROM captures ORDER BY id")
      .all() as Array<{ id: string; content_kind: string | null }>;
    const byId = Object.fromEntries(rows.map((r) => [r.id, r.content_kind]));
    expect(byId["cap_ok"]).toBe("article"); // success row backfilled
    expect(byId["cap_bad"]).toBeNull(); // failed row left null
  });
});
