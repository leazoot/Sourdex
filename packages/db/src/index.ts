/**
 * @sourdex/db — SQLite schema, migrations, repositories and transaction helpers.
 * Server-side only (depends on better-sqlite3). No UI or AI logic (PRD §8.5).
 */
export * from "./client.js";
export * from "./schema.js";
export * from "./migrate.js";
export * from "./migrations/index.js";
export * from "./mappers.js";
export * from "./source-hash.js";
export * from "./tx.js";
export * from "./testing.js";
export * from "./seed.js";
export * from "./repositories/index.js";
