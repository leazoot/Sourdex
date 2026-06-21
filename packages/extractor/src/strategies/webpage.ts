import {
  ExtractionError,
  type ExtractInput,
  type ExtractResult,
  type ExtractStrategy,
  type SourceType,
} from "@sourdex/core";
import { extractArticle } from "../html/readability.js";
import { extractDiscourseArticle } from "./adapters/discourse.js";
import { sanitizeHtml } from "../html/sanitize.js";
import { htmlToMarkdown } from "../markdown/to-markdown.js";
import { normalizeWhitespace } from "../text/plain-text.js";
import { countWords, readingTimeMinutes } from "../text/metrics.js";

/** Below this many characters, extracted text is treated as boilerplate, not an article. */
const MIN_CONTENT_CHARS = 25;

/** Extract a readable article from a full webpage via Readability (PRD §5.1.2). */
export class WebpageExtractStrategy implements ExtractStrategy {
  readonly sourceType: SourceType = "webpage";

  async extract(input: ExtractInput): Promise<ExtractResult> {
    if (!input.html || !input.html.trim()) {
      throw new ExtractionError("No HTML provided for webpage extraction");
    }

    // Site adapters (e.g. Discourse) handle lazy/virtualized pages that Readability mangles;
    // fall back to Readability for everything else (PRD §26.1).
    const article =
      extractDiscourseArticle(input.html, input.url) ?? extractArticle(input.html, input.url);
    if (!article) {
      throw new ExtractionError("Readability could not extract readable content");
    }

    const readableHtml = sanitizeHtml(article.content);
    const markdown = htmlToMarkdown(readableHtml);
    const plainText = normalizeWhitespace(article.textContent);
    if (plainText.length < MIN_CONTENT_CHARS) {
      throw new ExtractionError("Extracted content too short to be a readable article");
    }

    const wordCount = countWords(plainText);
    const title = (article.title ?? input.title ?? "").trim() || input.url || "Untitled";

    return {
      title,
      author: article.byline,
      excerpt: article.excerpt,
      readableHtml,
      markdown,
      plainText,
      wordCount,
      readingTime: readingTimeMinutes(wordCount),
    };
  }
}
