/** Search engine contract (PRD §9.3, §15). Implemented in packages/search. */

import type { SearchInput, SearchResult } from "../types/search.js";

/** Search facade used by services. v0.1: keyword (FTS5); v0.2 adds semantic/hybrid. */
export interface SearchEngine {
  search(input: SearchInput): Promise<SearchResult>;
}
