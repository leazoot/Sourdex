import { createDocument } from "../../html/dom.js";
import { precleanDocument } from "../../html/preclean.js";
import { escapeHtml } from "../../text/plain-text.js";
import type { Article } from "../../html/readability.js";

/**
 * Discourse site adapter (PRD §26.1 extraction fallback / site adapter).
 *
 * Discourse renders the post stream with virtual scrolling, so a one-shot DOM capture
 * only contains the loaded posts; the rest are byline-only placeholders. Readability turns
 * those stubs into noise. This adapter instead walks the loaded posts directly, taking each
 * post's `.cooked` body plus author/date, and skips any post without a body (placeholder).
 */

// Cheap string gate so non-Discourse pages skip the parse entirely.
const DISCOURSE_HINT = /discourse|topic-post|main-outlet/i;

export function isDiscourseDocument(document: Document): boolean {
  const generator = document.querySelector('meta[name="generator"]')?.getAttribute("content") ?? "";
  if (/discourse/i.test(generator)) return true;
  return Boolean(document.querySelector("#main-outlet") && document.querySelector(".topic-post"));
}

interface DiscoursePost {
  author: string | null;
  date: string | null;
  html: string;
  text: string;
}

function collectPosts(document: Document): DiscoursePost[] {
  const posts: DiscoursePost[] = [];
  document.querySelectorAll(".topic-post").forEach((post) => {
    const cooked = post.querySelector(".cooked");
    const text = cooked?.textContent?.trim() ?? "";
    // Skip not-yet-loaded posts (no rendered body) — these are the virtual-scroll stubs.
    if (!cooked || !text) return;

    const meta = post.querySelector(".topic-meta-data");
    const author =
      meta?.querySelector("[data-user-card]")?.getAttribute("data-user-card")?.trim() ||
      meta?.querySelector(".username")?.textContent?.trim() ||
      null;
    const date =
      meta?.querySelector(".relative-date")?.textContent?.trim() ||
      meta?.querySelector(".post-date")?.getAttribute("title")?.trim() ||
      null;

    posts.push({ author, date, html: cooked.innerHTML, text });
  });
  return posts;
}

/** Extract a Discourse topic as an Article, or null if the page is not Discourse. */
export function extractDiscourseArticle(html: string, url?: string | null): Article | null {
  if (!DISCOURSE_HINT.test(html)) return null;

  const document = createDocument(html, url);
  if (!isDiscourseDocument(document)) return null;

  precleanDocument(document);
  const posts = collectPosts(document);
  const first = posts[0];
  if (!first) return null;

  const title =
    document.querySelector(".fancy-title")?.textContent?.trim() || document.title?.trim() || null;

  const content = `<article>${posts
    .map((p) => {
      const head = [p.author, p.date].filter(Boolean).join(" · ");
      const header = head ? `<p><strong>${escapeHtml(head)}</strong></p>` : "";
      return `<section>${header}${p.html}</section>`;
    })
    .join("\n")}</article>`;

  const textContent = posts
    .map((p) => {
      const head = [p.author, p.date].filter(Boolean).join(" · ");
      return (head ? `${head}\n` : "") + p.text;
    })
    .join("\n\n");

  return {
    title,
    byline: first.author,
    excerpt: first.text.slice(0, 200),
    content,
    textContent,
    siteName: null,
  };
}
