/** Search and pagination domain types (PRD §13.3, §15). */

import type { SourceType } from "./item.js";

/** Search mode. v0.1 implements `keyword`; `semantic`/`hybrid` are v0.2 (PRD §15.1). */
export type SearchMode = "keyword" | "semantic" | "hybrid";

/** Field a search hit matched on (PRD §13.3 response). */
export type MatchedField = "title" | "content" | "summary" | "tags" | "annotations";

/** Search request parameters (PRD §13.3 GET /api/search). */
export interface SearchInput {
  q: string;
  type?: SourceType;
  tag?: string;
  domain?: string;
  /** ISO 8601 lower bound on savedAt. */
  from?: string;
  /** ISO 8601 upper bound on savedAt. */
  to?: string;
  mode?: SearchMode;
  /** Result ordering. Defaults to relevance (PRD §15.4). */
  sort?: "relevance" | "newest" | "oldest";
  page?: number;
  pageSize?: number;
  /** Debug mode: include the per-signal score breakdown in results (PRD §15.4.7). */
  debug?: boolean;
}

/** Per-signal contributions behind a hybrid score, shown in debug mode (PRD §15.3/§15.4.7). */
export interface ScoreBreakdown {
  keyword: number;
  semantic: number;
  tag: number;
  recency: number;
  userSignal: number;
  final: number;
}

/** A single search hit (PRD §13.3 response; display fields per PRD §15.4). */
export interface SearchResultItem {
  itemId: string;
  title: string;
  url: string | null;
  domain: string | null;
  type: SourceType;
  /** ISO 8601 savedAt, for displaying save time in results (PRD §15.4). */
  savedAt: string;
  /** Matched text fragment, may contain highlight markers. */
  snippet: string;
  score: number;
  matchedFields: MatchedField[];
  /** Present only when the request set `debug` (PRD §15.4.7). */
  scoreBreakdown?: ScoreBreakdown;
}

/** Search response payload (PRD §13.3). */
export interface SearchResult {
  results: SearchResultItem[];
}

/** Generic paginated list envelope. */
export interface Paginated<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
}
