/**
 * @sourdex/search — keyword search query building, snippet/highlight formatting and
 * relevance scoring (PRD §15). Pure logic over DTOs; the FTS5 MATCH execution lives in
 * @sourdex/db SearchRepository (PRD §8.5). Semantic/hybrid search is v0.2.
 */
export * from "./query.js";
