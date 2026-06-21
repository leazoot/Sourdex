import type { ExportFormat, Item, Tag } from "@sourdex/core";
import { buildFrontmatter } from "./frontmatter.js";

/** Input for assembling a single exported Markdown note. Pure DTO — no DB/file access. */
export interface MarkdownExportInput {
  item: Item;
  tags: Tag[];
  /** Extracted body markdown (from the capture); may be null/empty if extraction failed. */
  content: string | null;
  /** Reserved for layout differences between markdown and obsidian batch exports. */
  format?: ExportFormat;
}

/**
 * Assemble a single export note: frontmatter + title + source + summary + content
 * (PRD §5.1.7 example). The body markdown is the extractor's output; the original is never
 * overwritten. Returns a string the caller writes to disk under a safe filename (TASK-044).
 */
export function toMarkdownDocument(input: MarkdownExportInput): string {
  const { item, tags, content } = input;
  const parts: string[] = [buildFrontmatter(item, tags), "", `# ${item.title}`, ""];
  if (item.url) parts.push(`Source: ${item.url}`, "");
  if (item.summary && item.summary.trim()) parts.push("## Summary", "", item.summary.trim(), "");
  parts.push(
    "## Content",
    "",
    content && content.trim() ? content.trim() : "_No extracted content._",
    "",
  );
  return parts.join("\n");
}
