/** Capture domain types. Mirrors PRD §12.2 `captures`. */

/** Extraction outcome for a capture (PRD §12.2 `extraction_status`). */
export type ExtractionStatus = "pending" | "success" | "failed";

/**
 * Kind of stored content for a capture (faithful-capture tiers, see
 * docs/15_PROPOSAL_FAITHFUL_CAPTURE):
 * - `article`  — Tier 1 readable article (Readability / site adapter).
 * - `fulltext` — Tier 2 faithful full text recovered from the rendered DOM.
 * - `none`     — no readable text at all (pure image / paywalled).
 */
export type ContentKind = "article" | "fulltext" | "none";

/** Raw capture artifacts for an item. Paths are relative to the data directory (PRD §16.1). */
export interface Capture {
  id: string;
  itemId: string;
  rawHtmlPath: string | null;
  readableHtmlPath: string | null;
  markdownPath: string | null;
  screenshotPath: string | null;
  originalTextPath: string | null;
  extractionStatus: ExtractionStatus;
  extractionError: string | null;
  /** Capture tier of the stored content; null for not-yet-extracted or failed captures. */
  contentKind: ContentKind | null;
  /** ISO 8601 string. */
  createdAt: string;
}

/** Fields accepted when creating a capture record. */
export interface CreateCaptureInput {
  itemId: string;
  rawHtmlPath?: string | null;
  readableHtmlPath?: string | null;
  markdownPath?: string | null;
  screenshotPath?: string | null;
  originalTextPath?: string | null;
  extractionStatus?: ExtractionStatus;
  extractionError?: string | null;
}
