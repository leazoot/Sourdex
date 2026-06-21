import { Readability } from "@mozilla/readability";
import { createDocument } from "./dom.js";

/** Normalized result of running Readability over a document. */
export interface Article {
  title: string | null;
  byline: string | null;
  excerpt: string | null;
  /** Readable HTML content (still needs sanitizing before storage/render). */
  content: string;
  /** Plain text content of the article. */
  textContent: string;
  siteName: string | null;
}

/**
 * Run Readability over an HTML string. Returns null when no readable article can be
 * extracted (caller decides on fallback, PRD §26.1).
 */
export function extractArticle(html: string, url?: string | null): Article | null {
  const document = createDocument(html, url);
  const result = new Readability(document).parse();
  if (!result || !result.content || !result.textContent || !result.textContent.trim()) {
    return null;
  }
  return {
    title: result.title ?? null,
    byline: result.byline ?? null,
    excerpt: result.excerpt ?? null,
    content: result.content,
    textContent: result.textContent,
    siteName: result.siteName ?? null,
  };
}
