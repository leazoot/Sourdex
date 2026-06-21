/**
 * @sourdex/search — keyword search query building, snippet/highlight formatting and
 * relevance scoring (PRD §15). Pure logic over DTOs; the FTS5 MATCH execution lives in
 * @sourdex/db SearchRepository (PRD §8.5). Hybrid ranking (keyword+semantic+tag+recency)
 * is in hybrid.ts (v0.2).
 */
export * from "./query.js";
export * from "./hybrid.js";
