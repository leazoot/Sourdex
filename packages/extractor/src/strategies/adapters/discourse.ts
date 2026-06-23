import { createDocument } from "../../html/dom.js";
import { precleanDocument } from "../../html/preclean.js";
import { escapeHtml } from "../../text/plain-text.js";
import type { Article } from "../../html/readability.js";

/**
 * Discourse site adapter (PRD §26.1 extraction fallback / site adapter).
 *
 * Discourse renders the post stream with virtual scrolling, so a one-shot DOM capture
 * only contains the loaded posts; the rest are byline-only placeholders. Readability turns
 * those stubs into noise. This adapter walks the loaded `.topic-post` bodies directly, and
 * when virtual scrolling has unloaded them all (a long topic captured scrolled away from the
 * top), it recovers the first batch of posts from Discourse's embedded preload JSON instead.
 */

// Cheap string gate so non-Discourse pages skip the parse entirely.
const DISCOURSE_HINT = /discourse|topic-post|main-outlet|data-preloaded/i;

export function isDiscourseDocument(document: Document): boolean {
  const generator = document.querySelector('meta[name="generator"]')?.getAttribute("content") ?? "";
  if (/discourse/i.test(generator)) return true;
  // #main-outlet is Discourse-specific; accept it alone since virtual scrolling can leave a
  // topic page with zero rendered .topic-post nodes (the content then comes from the preload).
  return Boolean(document.querySelector("#main-outlet"));
}

interface DiscoursePost {
  author: string | null;
  date: string | null;
  html: string;
  text: string;
}

/** Shape of one post inside Discourse's `data-preloaded` topic JSON (subset we use). */
interface RawPreloadPost {
  cooked?: string;
  username?: string;
  name?: string;
  created_at?: string;
}

interface PreloadResult {
  posts: DiscoursePost[];
  title: string | null;
}

/**
 * Recover posts from Discourse's embedded preload JSON (`<div id="data-preloaded">`). The
 * attribute holds a map whose `topic_<id>` entry is a JSON string with `post_stream.posts`,
 * each carrying the rendered `cooked` HTML — available even when the DOM posts are unloaded.
 */
function collectPostsFromPreload(document: Document): PreloadResult {
  const empty: PreloadResult = { posts: [], title: null };
  const raw = document.getElementById("data-preloaded")?.getAttribute("data-preloaded");
  if (!raw) return empty;

  let envelope: Record<string, string>;
  try {
    envelope = JSON.parse(raw) as Record<string, string>;
  } catch {
    return empty;
  }
  const topicKey = Object.keys(envelope).find((key) => /^topic_\d+$/.test(key));
  const topicJson = topicKey ? envelope[topicKey] : undefined;
  if (!topicJson) return empty;

  let topic: { title?: string; post_stream?: { posts?: RawPreloadPost[] } };
  try {
    topic = JSON.parse(topicJson) as typeof topic;
  } catch {
    return empty;
  }

  const scratch = document.createElement("div");
  const posts: DiscoursePost[] = [];
  for (const post of topic.post_stream?.posts ?? []) {
    const html = typeof post.cooked === "string" ? post.cooked : "";
    if (!html) continue;
    scratch.innerHTML = html;
    const text = scratch.textContent?.trim() ?? "";
    if (!text) continue;
    posts.push({
      author: post.username ?? post.name ?? null,
      date: post.created_at ?? null,
      html,
      text,
    });
  }
  return { posts, title: topic.title?.trim() || null };
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

  // Read the preload before preclean (which mutates the body), then prefer the rendered DOM
  // posts when present, falling back to the preload when virtual scrolling unloaded them.
  const preload = collectPostsFromPreload(document);
  precleanDocument(document);
  const domPosts = collectPosts(document);
  const posts = domPosts.length > 0 ? domPosts : preload.posts;
  const first = posts[0];
  if (!first) return null;

  const title =
    document.querySelector(".fancy-title")?.textContent?.trim() ||
    preload.title ||
    document.title?.trim() ||
    null;

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
