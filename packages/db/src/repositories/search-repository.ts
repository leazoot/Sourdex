import { HIGHLIGHT_CLOSE, HIGHLIGHT_OPEN, segmentCjk, type SourceType } from "@sourdex/core";
import { sql, type SQL } from "drizzle-orm";
import type { Db } from "../client.js";
import { normalizeTagName } from "./tag-repository.js";

/** Row written to the FTS index for an item (PRD §15.2). */
export interface FtsIndexInput {
  itemId: string;
  title: string;
  plainText: string;
  summary?: string | null;
  tags?: string | null;
}

/** A raw FTS hit (item id + matched snippet). Used as a simple "is it indexed" probe. */
export interface FtsSearchHit {
  itemId: string;
  snippet: string;
}

/** Structured filters applied alongside the FTS MATCH (PRD §13.3). */
export interface SearchQueryFilters {
  type?: SourceType;
  domain?: string;
  /** Raw (un-normalized) tag name; normalized internally. */
  tag?: string;
  /** ISO 8601 lower bound on savedAt. */
  from?: string;
  /** ISO 8601 upper bound on savedAt. */
  to?: string;
}

export interface SearchQueryOptions {
  limit?: number;
  offset?: number;
  sort?: "relevance" | "newest" | "oldest";
}

/** A full search hit joined with item metadata (PRD §13.3 / §15.4). */
export interface SearchQueryRow {
  itemId: string;
  title: string;
  url: string | null;
  domain: string | null;
  type: SourceType;
  savedAt: string;
  /** FTS5 bm25 rank (more negative = more relevant). */
  bm25: number;
  /** Snippet over plain_text with HIGHLIGHT markers; still CJK-segmented (caller cleans). */
  snippet: string;
  titleMatch: number;
  contentMatch: number;
  summaryMatch: number;
  tagsMatch: number;
}

/**
 * Maintains and queries the `items_fts` virtual table at the application layer
 * (decision OQ-A3). Keyword search only in v0.1 (PRD §15.1). Indexed text is CJK-segmented
 * so the unicode61 tokenizer can match Chinese substrings (decision OQ-A7).
 */
export class SearchRepository {
  constructor(private readonly db: Db) {}

  /** Upsert an item's searchable text (delete-then-insert keeps it simple and correct). */
  index(input: FtsIndexInput): void {
    this.removeFromIndex(input.itemId);
    this.db.run(
      sql`INSERT INTO items_fts (item_id, title, plain_text, summary, tags)
          VALUES (
            ${input.itemId},
            ${segmentCjk(input.title)},
            ${segmentCjk(input.plainText)},
            ${segmentCjk(input.summary ?? "")},
            ${segmentCjk(input.tags ?? "")}
          )`,
    );
  }

  removeFromIndex(itemId: string): void {
    this.db.run(sql`DELETE FROM items_fts WHERE item_id = ${itemId}`);
  }

  /** Simple keyword probe used by tests/diagnostics; query is treated as an FTS expression. */
  search(query: string, options: { limit?: number; offset?: number } = {}): FtsSearchHit[] {
    const limit = options.limit && options.limit > 0 ? options.limit : 20;
    const offset = options.offset && options.offset > 0 ? options.offset : 0;
    const match = segmentCjk(query) || query;
    const rows = this.db.all(
      sql`SELECT item_id AS itemId, snippet(items_fts, 2, '[', ']', '…', 12) AS snippet
          FROM items_fts
          WHERE items_fts MATCH ${match}
          ORDER BY rank
          LIMIT ${limit} OFFSET ${offset}`,
    ) as FtsSearchHit[];
    return rows;
  }

  /**
   * Full keyword search: FTS5 MATCH joined with item metadata, structured filters applied
   * in SQL, soft-deleted items excluded. `match` must be a prepared FTS expression
   * (see @sourdex/search buildMatchExpression). Ordered by relevance, newest or oldest.
   */
  queryItems(
    match: string,
    filters: SearchQueryFilters = {},
    options: SearchQueryOptions = {},
  ): SearchQueryRow[] {
    const limit = options.limit && options.limit > 0 ? options.limit : 20;
    const offset = options.offset && options.offset > 0 ? options.offset : 0;

    const conditions: SQL[] = [sql`items_fts MATCH ${match}`, sql`i.status != 'deleted'`];
    if (filters.type) conditions.push(sql`i.type = ${filters.type}`);
    if (filters.domain) conditions.push(sql`i.domain = ${filters.domain}`);
    if (filters.from) conditions.push(sql`i.saved_at >= ${filters.from}`);
    if (filters.to) conditions.push(sql`i.saved_at <= ${filters.to}`);
    if (filters.tag) {
      conditions.push(
        sql`EXISTS (SELECT 1 FROM item_tags it JOIN tags t ON it.tag_id = t.id
                    WHERE it.item_id = i.id AND t.normalized_name = ${normalizeTagName(filters.tag)})`,
      );
    }
    const where = sql.join(conditions, sql` AND `);

    const order =
      options.sort === "newest"
        ? sql`i.saved_at DESC`
        : options.sort === "oldest"
          ? sql`i.saved_at ASC`
          : sql`bm25(items_fts) ASC`;

    // char(2)/char(3) are control-char sentinels (never present in text): if highlight()
    // inserted one, that column matched -> drives matchedFields (PRD §13.3 response).
    const rows = this.db.all(
      sql`SELECT
            i.id AS itemId,
            i.title AS title,
            i.url AS url,
            i.domain AS domain,
            i.type AS type,
            i.saved_at AS savedAt,
            bm25(items_fts) AS bm25,
            snippet(items_fts, 2, ${HIGHLIGHT_OPEN}, ${HIGHLIGHT_CLOSE}, '…', 32) AS snippet,
            (instr(highlight(items_fts, 1, char(2), char(3)), char(2)) > 0) AS titleMatch,
            (instr(highlight(items_fts, 2, char(2), char(3)), char(2)) > 0) AS contentMatch,
            (instr(highlight(items_fts, 3, char(2), char(3)), char(2)) > 0) AS summaryMatch,
            (instr(highlight(items_fts, 4, char(2), char(3)), char(2)) > 0) AS tagsMatch
          FROM items_fts
          JOIN items i ON i.id = items_fts.item_id
          WHERE ${where}
          ORDER BY ${order}
          LIMIT ${limit} OFFSET ${offset}`,
    ) as SearchQueryRow[];
    return rows;
  }
}
