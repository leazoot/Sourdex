/** Item domain types. Mirrors PRD §12.1 `items`, in camelCase domain form. */

/** PRD §8.4 / §12.1 — kind of saved source. */
export type SourceType = "webpage" | "selection" | "pdf" | "video" | "screenshot";

/** PRD §8.4 / §12.1 — lifecycle status of an item. */
export type ItemStatus = "inbox" | "read" | "archived" | "deleted";

/** AI enrichment status for an item (PRD §12.1 `ai_status`, default `none`). */
export type AiStatus = "none" | "pending" | "done" | "failed";

/** Sort options for item listing / search (PRD §6.3.2). */
export type ItemSort = "newest" | "oldest" | "relevance" | "title";

/** A saved resource. Maps to the `items` table (PRD §12.1). */
export interface Item {
  id: string;
  type: SourceType;
  status: ItemStatus;
  title: string;
  url: string | null;
  canonicalUrl: string | null;
  domain: string | null;
  author: string | null;
  /** ISO 8601 string, or null when unknown. */
  publishedAt: string | null;
  /** ISO 8601 string. */
  savedAt: string;
  /** ISO 8601 string. */
  updatedAt: string;
  summary: string | null;
  oneSentence: string | null;
  thumbnailPath: string | null;
  /** Hash used for duplicate detection (see OQ-A4). */
  sourceHash: string | null;
  wordCount: number;
  readingTime: number;
  aiStatus: AiStatus;
}

/** Fields accepted when creating an item. Server fills id/savedAt/updatedAt/status defaults. */
export interface CreateItemInput {
  type: SourceType;
  title: string;
  url?: string | null;
  canonicalUrl?: string | null;
  domain?: string | null;
  author?: string | null;
  publishedAt?: string | null;
  summary?: string | null;
  oneSentence?: string | null;
  thumbnailPath?: string | null;
  sourceHash?: string | null;
  wordCount?: number;
  readingTime?: number;
}

/** Fields a user/service may patch (PRD §13.2 PATCH). Tags are managed separately. */
export interface UpdateItemInput {
  title?: string;
  status?: ItemStatus;
  summary?: string | null;
  oneSentence?: string | null;
}

/** Query parameters for listing items (PRD §13.2 GET /api/items). */
export interface ItemListQuery {
  status?: ItemStatus;
  type?: SourceType;
  tag?: string;
  domain?: string;
  q?: string;
  sort?: ItemSort;
  page?: number;
  pageSize?: number;
}
