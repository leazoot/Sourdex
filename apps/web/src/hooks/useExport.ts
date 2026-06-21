import type { ExportFormat } from "@sourdex/core";
import { useMutation } from "@tanstack/react-query";
import { exportMarkdown } from "@/lib/api/export";

/** Trigger a Markdown/Obsidian export (PRD §5.1.7). Returns the produced file path. */
export function useExport() {
  return useMutation({
    mutationFn: ({ itemIds, format }: { itemIds: string[]; format?: ExportFormat }) =>
      exportMarkdown(itemIds, format),
  });
}
