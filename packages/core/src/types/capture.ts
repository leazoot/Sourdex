/** Capture domain types. Mirrors PRD §12.2 `captures`. */

/** Extraction outcome for a capture (PRD §12.2 `extraction_status`). */
export type ExtractionStatus = "pending" | "success" | "failed";

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
