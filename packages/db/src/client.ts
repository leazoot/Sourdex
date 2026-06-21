import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema.js";

/** Underlying better-sqlite3 handle. */
export type SqliteDatabase = Database.Database;

/** Drizzle database bound to the Sourdex schema. */
export type Db = ReturnType<typeof createDb>;

/**
 * Open a SQLite database at `path` (use ":memory:" for tests). Enables WAL for
 * concurrent reads and enforces foreign keys.
 */
export function createSqlite(path: string): SqliteDatabase {
  const sqlite = new Database(path);
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");
  return sqlite;
}

/** Wrap a SQLite handle in a typed Drizzle client. */
export function createDb(sqlite: SqliteDatabase) {
  return drizzle(sqlite, { schema });
}
