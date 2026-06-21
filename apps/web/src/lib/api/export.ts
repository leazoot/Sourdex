import type { ExportFormat, ExportResult } from "@sourdex/core";
import { apiFetch } from "./client";

/** POST /api/export/markdown (PRD §13.5). Single id → .md; multiple → zip. */
export function exportMarkdown(
  itemIds: string[],
  format: ExportFormat = "markdown",
): Promise<ExportResult> {
  return apiFetch<ExportResult>("/api/export/markdown", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ itemIds, format }),
  });
}
