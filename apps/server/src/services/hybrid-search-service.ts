import type {
  MatchedField,
  SearchInput,
  SearchResult,
  SearchResultItem,
  SourceType,
} from "@sourdex/core";
import type { SearchQueryRow, SearchRepository, TagRepository } from "@sourdex/db";
import { normalizeTagName } from "@sourdex/db";
import {
  buildMatchExpression,
  cleanSnippet,
  hybridScore,
  normalizeScores,
  normalizeSimilarities,
  recencyScore,
  tagScore,
  tokenizeQuery,
} from "@sourdex/search";
import type { SemanticSearchService } from "./semantic-search-service.js";

/** How many candidates to pull from each retriever before blending (PRD §15.3). */
const CANDIDATES = 50;
const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 50;

interface Merged {
  itemId: string;
  title: string;
  url: string | null;
  domain: string | null;
  type: SourceType;
  savedAt: string;
  keywordScore: number;
  semanticScore: number;
  snippet: string;
  matchedFields: MatchedField[];
}

export interface HybridSearchServiceDeps {
  searchRepo: SearchRepository;
  semanticSearchService: SemanticSearchService;
  tagRepo: TagRepository;
  /** Injectable clock for recency scoring (defaults to Date.now). */
  now?: () => number;
}

function deriveMatchedFields(row: SearchQueryRow): MatchedField[] {
  const fields: MatchedField[] = [];
  if (row.titleMatch) fields.push("title");
  if (row.contentMatch) fields.push("content");
  if (row.summaryMatch) fields.push("summary");
  if (row.tagsMatch) fields.push("tags");
  return fields;
}

/**
 * Hybrid search (PRD §15.3): blends keyword (FTS), semantic (vector), tag, recency and
 * user-signal scores into a single ranking. Degrades gracefully — when no embedding
 * provider is enabled the semantic signal is simply 0, so hybrid still returns
 * keyword-ranked results and never errors (PRD §5.2.3.7). user_signal is reserved (0)
 * until annotations/favorites land (STAGE-18, PRD §15.3 rule 5).
 */
export class HybridSearchService {
  constructor(private readonly deps: HybridSearchServiceDeps) {}

  async search(input: SearchInput): Promise<SearchResult> {
    const nowMs = (this.deps.now ?? Date.now)();
    const tokens = tokenizeQuery(input.q);
    if (tokens.length === 0 && !input.q.trim()) return { results: [] };

    const merged = new Map<string, Merged>();
    this.collectKeyword(input, merged);
    await this.collectSemantic(input, merged);

    const filtered = [...merged.values()].filter((m) => this.passesFilters(m, input));

    const scored = filtered.map((m) => {
      const tags = this.deps.tagRepo.listByItem(m.itemId).map((t) => t.name);
      const breakdown = {
        keyword: m.keywordScore,
        semantic: m.semanticScore,
        tag: tagScore(tokens, tags),
        recency: recencyScore(m.savedAt, nowMs),
        userSignal: 0,
      };
      const final = hybridScore({
        keywordScore: breakdown.keyword,
        semanticScore: breakdown.semantic,
        tagScore: breakdown.tag,
        recencyScore: breakdown.recency,
        userSignalScore: breakdown.userSignal,
      });
      return { m, breakdown, final };
    });

    scored.sort((a, b) => {
      if (input.sort === "newest") return b.m.savedAt.localeCompare(a.m.savedAt);
      if (input.sort === "oldest") return a.m.savedAt.localeCompare(b.m.savedAt);
      return b.final - a.final;
    });

    const page = input.page && input.page > 0 ? input.page : 1;
    const pageSize = Math.min(
      input.pageSize && input.pageSize > 0 ? input.pageSize : DEFAULT_PAGE_SIZE,
      MAX_PAGE_SIZE,
    );
    const pageItems = scored.slice((page - 1) * pageSize, (page - 1) * pageSize + pageSize);

    const results: SearchResultItem[] = pageItems.map(({ m, breakdown, final }) => ({
      itemId: m.itemId,
      title: m.title,
      url: m.url,
      domain: m.domain,
      type: m.type,
      savedAt: m.savedAt,
      snippet: m.snippet,
      score: Math.round(final * 1000) / 1000,
      matchedFields: m.matchedFields,
      ...(input.debug ? { scoreBreakdown: { ...breakdown, final } } : {}),
    }));
    return { results };
  }

  private collectKeyword(input: SearchInput, merged: Map<string, Merged>): void {
    const match = buildMatchExpression(input.q);
    if (!match) return;
    const rows = this.deps.searchRepo.queryItems(
      match,
      { type: input.type, domain: input.domain, tag: input.tag, from: input.from, to: input.to },
      { limit: CANDIDATES, offset: 0, sort: "relevance" },
    );
    const scores = normalizeScores(rows.map((r) => r.bm25));
    rows.forEach((row, i) => {
      merged.set(row.itemId, {
        itemId: row.itemId,
        title: row.title,
        url: row.url,
        domain: row.domain,
        type: row.type,
        savedAt: row.savedAt,
        keywordScore: scores[i] ?? 0,
        semanticScore: 0,
        snippet: cleanSnippet(row.snippet),
        matchedFields: deriveMatchedFields(row),
      });
    });
  }

  private async collectSemantic(input: SearchInput, merged: Map<string, Merged>): Promise<void> {
    if (!this.deps.semanticSearchService.enabledProvider()) return;
    const hits = await this.deps.semanticSearchService.search(input.q, { limit: CANDIDATES });
    const scores = normalizeSimilarities(hits.map((h) => h.score));
    hits.forEach((hit, i) => {
      const existing = merged.get(hit.itemId);
      if (existing) {
        existing.semanticScore = scores[i] ?? 0;
        return;
      }
      merged.set(hit.itemId, {
        itemId: hit.itemId,
        title: hit.title,
        url: hit.url,
        domain: hit.domain,
        type: hit.type,
        savedAt: hit.savedAt,
        keywordScore: 0,
        semanticScore: scores[i] ?? 0,
        snippet: hit.snippet,
        matchedFields: [],
      });
    });
  }

  /** Apply structured filters uniformly (semantic-only hits aren't filtered upstream). */
  private passesFilters(m: Merged, input: SearchInput): boolean {
    if (input.type && m.type !== input.type) return false;
    if (input.domain && m.domain !== input.domain) return false;
    if (input.from && m.savedAt < input.from) return false;
    if (input.to && m.savedAt > input.to) return false;
    if (input.tag) {
      const want = normalizeTagName(input.tag);
      const has = this.deps.tagRepo.listByItem(m.itemId).some((t) => t.normalizedName === want);
      if (!has) return false;
    }
    return true;
  }
}
