import { nowIso } from "@sourdex/core";
import type { SqliteDatabase } from "./client.js";
import { MIGRATIONS } from "./migrations/index.js";

const MIGRATIONS_TABLE = "_sourdex_migrations";

/**
 * Apply all pending migrations in order, tracking applied names in `_sourdex_migrations`.
 * Idempotent: running again is a no-op. Each migration runs in its own transaction.
 *
 * @returns names of migrations applied in this run.
 */
export function runMigrations(sqlite: SqliteDatabase): string[] {
  sqlite.exec(
    `CREATE TABLE IF NOT EXISTS ${MIGRATIONS_TABLE} (name TEXT PRIMARY KEY, applied_at TEXT NOT NULL);`,
  );

  const appliedRows = sqlite.prepare(`SELECT name FROM ${MIGRATIONS_TABLE}`).all() as Array<{
    name: string;
  }>;
  const applied = new Set(appliedRows.map((row) => row.name));

  const record = sqlite.prepare(`INSERT INTO ${MIGRATIONS_TABLE} (name, applied_at) VALUES (?, ?)`);

  const ran: string[] = [];
  for (const migration of MIGRATIONS) {
    if (applied.has(migration.name)) continue;
    const apply = sqlite.transaction(() => {
      sqlite.exec(migration.sql);
      record.run(migration.name, nowIso());
    });
    apply();
    ran.push(migration.name);
  }
  return ran;
}
