import type { ExportFormat, ExportResult, ExportScope } from "@sourdex/core";
import { apiFetch } from "./client";

export interface ExportRequest {
  itemIds?: string[];
  scope?: ExportScope;
  format?: ExportFormat;
}

/** POST /api/export/markdown (PRD §13.5). Handles all formats; items via list or scope. */
export function runExport(input: ExportRequest): Promise<ExportResult> {
  return apiFetch<ExportResult>("/api/export/markdown", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ format: "markdown", ...input }),
  });
}

/** Convenience for the Reader/Library buttons: export an explicit list of items. */
export function exportMarkdown(
  itemIds: string[],
  format: ExportFormat = "markdown",
): Promise<ExportResult> {
  return runExport({ itemIds, format });
}
