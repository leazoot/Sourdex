/** Export contract (PRD §8.9, §13.5). Implemented in packages/exporter. */

/** Supported export formats. v0.1 implements `markdown` and `obsidian`. */
export type ExportFormat = "markdown" | "obsidian" | "json" | "csv";

/** Export request. */
export interface ExportInput {
  itemIds: string[];
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
