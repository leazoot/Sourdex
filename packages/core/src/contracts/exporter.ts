/** Export contract (PRD §8.9, §13.5). Implemented in packages/exporter. */

import type { ItemStatus } from "../types/item.js";

/** Supported export formats (PRD §8.9). */
export type ExportFormat = "markdown" | "obsidian" | "json" | "csv";

/**
 * Which items to export when not passing an explicit `itemIds` list (Export page, PRD §6.2):
 * the whole library, items in a given status (e.g. Inbox), or items carrying a given tag.
 */
export type ExportScope =
  | { type: "all" }
  | { type: "status"; status: ItemStatus }
  | { type: "tag"; tagId: string };

/** Export request. Provide either an explicit `itemIds` list or a `scope` to resolve. */
export interface ExportInput {
  itemIds?: string[];
  scope?: ExportScope;
  format: ExportFormat;
}

/** An item that could not be exported (OQ-R2: batch skips and reports rather than failing). */
export interface ExportFailure {
  itemId: string;
  reason: string;
}

/** Export result pointing at the produced file/archive (PRD §13.5 response). */
export interface ExportResult {
  exportId: string;
  /** Relative path (under the data dir) of the produced file or zip archive. */
  path: string;
  /** Number of items written to the export. */
  count: number;
  /** Items skipped during a batch export (OQ-R2); empty when all succeeded. */
  failed: ExportFailure[];
}

/** Exporter facade used by services. */
export interface Exporter {
  export(input: ExportInput): Promise<ExportResult>;
}
