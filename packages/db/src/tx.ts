import type { Db } from "./client.js";

/**
 * Run `fn` inside a database transaction (PRD §8.5 — transaction helper). Used by
 * services that must write across tables atomically (e.g. items + captures).
 */
export function withTransaction<T>(db: Db, fn: (tx: Db) => T): T {
  return db.transaction((tx) => fn(tx as unknown as Db));
}
