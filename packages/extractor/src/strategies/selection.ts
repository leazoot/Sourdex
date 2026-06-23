import {
  ExtractionError,
  type ExtractInput,
  type ExtractResult,
  type ExtractStrategy,
  type SourceType,
} from "@sourdex/core";
import { escapeHtml, normalizeWhitespace } from "../text/plain-text.js";
import { countWords, readingTimeMinutes } from "../text/metrics.js";

/** Wrap a user's selected text as an item (PRD §4.2). Also used as a webpage fallback. */
export class SelectionExtractStrategy implements ExtractStrategy {
  readonly sourceType: SourceType = "selection";

  async extract(input: ExtractInput): Promise<ExtractResult> {
    const text = normalizeWhitespace(input.selectedText ?? "");
    if (!text) {
      throw new ExtractionError("No selected text provided");
    }

    const paragraphs = text.split(/\n{2,}/);
    const readableHtml = paragraphs.map((p) => `<p>${escapeHtml(p)}</p>`).join("\n");
    const firstLine = text.split("\n")[0] ?? "";
    const title = (input.title ?? "").trim() || firstLine.slice(0, 80) || "Selection";
    const wordCount = countWords(text);

    return {
      title,
      author: null,
      excerpt: text.slice(0, 200),
      readableHtml,
      markdown: text,
      plainText: text,
      wordCount,
      readingTime: readingTimeMinutes(wordCount),
      contentKind: "article",
    };
  }
}
