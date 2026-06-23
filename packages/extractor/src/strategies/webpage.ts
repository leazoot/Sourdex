import {
  ExtractionError,
  type ExtractInput,
  type ExtractResult,
  type ExtractStrategy,
  type SourceType,
} from "@sourdex/core";
import { extractArticle, type Article } from "../html/readability.js";
import { extractDiscourseArticle } from "./adapters/discourse.js";
import { fulltextFromHtml } from "../html/fulltext.js";
import { sanitizeHtml } from "../html/sanitize.js";
import { htmlToMarkdown } from "../markdown/to-markdown.js";
import { normalizeWhitespace } from "../text/plain-text.js";
import { countWords, readingTimeMinutes } from "../text/metrics.js";

/** Below this many characters, an extracted "article" is too thin to trust — fall back. */
const MIN_CONTENT_CHARS = 25;

/**
 * App / tool pages (dashboards, search tools) have no article — Readability falls back to
 * the footer, yielding a few words of legal boilerplate. When the extract is short *and*
 * dominated by such markers, the article is rejected so the page degrades to Tier 2 full
 * text instead of storing the footer as the body (PRD §26.1, faithful-capture FC2).
 */
const MIN_ARTICLE_WORDS = 60;
const BOILERPLATE = /©|版权|保留所有权利|all rights reserved|copyright/i;

/**
 * Extract content from a full webpage (PRD §5.1.2, §26.1).
 *
 * Tier 1: a readable article via a site adapter (Discourse) or Readability. When that
 * fails — or yields only thin boilerplate (app/tool pages) — Tier 2 recovers the faithful
 * full text from the rendered DOM so the item is still readable and searchable. Only when
 * even the full text is empty does extraction fail (the item stays saved as a bookmark).
 */
export class WebpageExtractStrategy implements ExtractStrategy {
  readonly sourceType: SourceType = "webpage";

  async extract(input: ExtractInput): Promise<ExtractResult> {
    if (!input.html || !input.html.trim()) {
      throw new ExtractionError("No HTML provided for webpage extraction");
    }

    // Site adapters (e.g. Discourse) handle lazy/virtualized pages that Readability mangles.
    const article =
      extractDiscourseArticle(input.html, input.url) ?? extractArticle(input.html, input.url);

    const readable = article ? this.buildArticleResult(article, input) : null;
    if (readable) return readable;

    // Tier 2: faithful full-text fallback for app/tool pages and anything Readability can't
    // turn into an article.
    const fullText = fulltextFromHtml(input.html, input.url);
    if (!fullText) {
      throw new ExtractionError("Page has no readable content");
    }

    const wordCount = countWords(fullText);
    const title = (article?.title ?? input.title ?? "").trim() || input.url || "Untitled";
    return {
      title,
      author: null,
      excerpt: fullText.slice(0, 200),
      readableHtml: null,
      markdown: fullText,
      plainText: fullText,
      wordCount,
      readingTime: readingTimeMinutes(wordCount),
      contentKind: "fulltext",
    };
  }

  /** Build a Tier 1 article result, or null when the article is too thin to trust. */
  private buildArticleResult(article: Article, input: ExtractInput): ExtractResult | null {
    const plainText = normalizeWhitespace(article.textContent);
    if (plainText.length < MIN_CONTENT_CHARS) return null;

    const wordCount = countWords(plainText);
    if (wordCount < MIN_ARTICLE_WORDS && BOILERPLATE.test(plainText)) return null;

    const readableHtml = sanitizeHtml(article.content);
    const title = (article.title ?? input.title ?? "").trim() || input.url || "Untitled";
    return {
      title,
      author: article.byline,
      excerpt: article.excerpt,
      readableHtml,
      markdown: htmlToMarkdown(readableHtml),
      plainText,
      wordCount,
      readingTime: readingTimeMinutes(wordCount),
      contentKind: "article",
    };
  }
}
