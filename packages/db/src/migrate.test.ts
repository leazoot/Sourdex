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
    expect(ran).toEqual(["0000_init"]);

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
});
