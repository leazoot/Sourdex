import { createDb, createSqlite, type Db, type SqliteDatabase } from "./client.js";
import { runMigrations } from "./migrate.js";

/**
 * Create a fully-migrated in-memory database for tests (PRD §9.5, §21.1 — repositories
 * are testable against a real SQLite). Caller should `sqlite.close()` when done.
 */
export function createMemoryDb(): { sqlite: SqliteDatabase; db: Db } {
  const sqlite = createSqlite(":memory:");
  runMigrations(sqlite);
  const db = createDb(sqlite);
  return { sqlite, db };
}
