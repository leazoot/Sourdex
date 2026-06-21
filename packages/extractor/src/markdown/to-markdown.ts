import TurndownService from "turndown";

/** Convert (sanitized) HTML to Markdown (PRD §5.1.2). */
export function htmlToMarkdown(html: string): string {
  const turndown = new TurndownService({
    headingStyle: "atx",
    codeBlockStyle: "fenced",
    bulletListMarker: "-",
  });
  return turndown.turndown(html).trim();
}
