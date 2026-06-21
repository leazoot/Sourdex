import type { MatchedField, SearchEngine, SearchInput, SearchResult } from "@sourdex/core";
import type { SearchQueryRow, SearchRepository } from "@sourdex/db";
import { buildMatchExpression, cleanSnippet, normalizeScores } from "@sourdex/search";

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 50;

export interface SearchServiceDeps {
  searchRepo: SearchRepository;
}

/** Maps which FTS columns matched to the response's matchedFields (PRD §13.3). */
function deriveMatchedFields(row: SearchQueryRow): MatchedField[] {
  const fields: MatchedField[] = [];
  if (row.titleMatch) fields.push("title");
  if (row.contentMatch) fields.push("content");
  if (row.summaryMatch) fields.push("summary");
  if (row.tagsMatch) fields.push("tags");
  return fields;
}

/**
 * Keyword search service (PRD §15.1). Builds a safe FTS expression from the user query,
 * runs it through the SearchRepository with structured filters, then formats snippets and
 * relevance scores. Implements the SearchEngine contract; semantic/hybrid modes are v0.2.
 */
export class SearchService implements SearchEngine {
  constructor(private readonly deps: SearchServiceDeps) {}

  async search(input: SearchInput): Promise<SearchResult> {
    const match = buildMatchExpression(input.q);
    if (!match) return { results: [] };

    const page = input.page && input.page > 0 ? input.page : 1;
    const pageSize = Math.min(
      input.pageSize && input.pageSize > 0 ? input.pageSize : DEFAULT_PAGE_SIZE,
      MAX_PAGE_SIZE,
    );

    const rows = this.deps.searchRepo.queryItems(
      match,
      { type: input.type, domain: input.domain, tag: input.tag, from: input.from, to: input.to },
      { limit: pageSize, offset: (page - 1) * pageSize, sort: input.sort },
    );

    const scores = normalizeScores(rows.map((r) => r.bm25));
    const results = rows.map((row, i) => ({
      itemId: row.itemId,
      title: row.title,
      url: row.url,
      domain: row.domain,
      type: row.type,
      savedAt: row.savedAt,
      snippet: cleanSnippet(row.snippet),
      score: scores[i] ?? 0,
      matchedFields: deriveMatchedFields(row),
    }));
    return { results };
  }
}
