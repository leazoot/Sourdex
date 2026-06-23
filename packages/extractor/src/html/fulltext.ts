/**
 * Tier 2 faithful full-text fallback (PRD §26.1, see docs/15_PROPOSAL_FAITHFUL_CAPTURE).
 *
 * When Readability/site adapters cannot extract a readable *article* (app/tool pages,
 * dashboards, search results), the rendered DOM still holds the real text — Readability
 * just discards it. This recovers that text faithfully: strip non-content nodes, separate
 * block elements so words don't glue together, and normalize whitespace. It does not aim
 * for clean prose, only "saved and searchable" over "nothing at all".
 */

import { createDocument } from "./dom.js";
import { precleanDocument } from "./preclean.js";
import { normalizeWhitespace } from "../text/plain-text.js";

/** Upper bound on recovered text (FC3); larger pages are truncated. ~200KB of characters. */
const MAX_FULLTEXT_CHARS = 200_000;

/**
 * Structural chrome / non-content tags removed before reading text. `precleanDocument`
 * already drops script/style/noscript/template and skeleton shells; this adds page chrome
 * and embedded graphics that carry no readable body text.
 */
const NOISE_TAGS = ["svg", "iframe", "nav", "footer", "header", "aside"];

/**
 * Block-level tags after which a line break is inserted, so adjacent blocks (e.g. flex
 * layouts) don't merge into one run. Inline elements contribute their text without breaks.
 */
const BLOCK_TAGS = new Set([
  "address",
  "article",
  "blockquote",
  "details",
  "dd",
  "div",
  "dl",
  "dt",
  "fieldset",
  "figcaption",
  "figure",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "hr",
  "li",
  "main",
  "ol",
  "p",
  "pre",
  "section",
  "summary",
  "table",
  "td",
  "th",
  "tr",
  "ul",
]);

/** Collect text from a node tree, inserting newlines around block elements and for <br>. */
function collectText(node: Node): string {
  let out = "";
  node.childNodes.forEach((child) => {
    if (child.nodeType === child.TEXT_NODE) {
      out += child.textContent ?? "";
      return;
    }
    if (child.nodeType !== child.ELEMENT_NODE) return;

    const el = child as Element;
    const tag = el.tagName.toLowerCase();
    if (tag === "br") {
      out += "\n";
      return;
    }
    const inner = collectText(el);
    out += BLOCK_TAGS.has(tag) ? `\n${inner}\n` : inner;
  });
  return out;
}

/**
 * Recover faithful full text from a rendered HTML page. Returns "" when the page has no
 * readable text (the caller maps that to contentKind "none"). Output is normalized and
 * capped at {@link MAX_FULLTEXT_CHARS}.
 */
export function fulltextFromHtml(html: string, url?: string | null): string {
  if (!html || !html.trim()) return "";

  const document = createDocument(html, url);
  const body = document.body;
  if (!body) return "";

  precleanDocument(document);
  for (const tag of NOISE_TAGS) {
    body.querySelectorAll(tag).forEach((node) => node.remove());
  }

  const text = normalizeWhitespace(collectText(body));
  if (text.length <= MAX_FULLTEXT_CHARS) return text;
  // Truncate on a whitespace boundary near the cap to avoid splitting a word/CJK run.
  const slice = text.slice(0, MAX_FULLTEXT_CHARS);
  const lastBreak = slice.lastIndexOf("\n");
  return (lastBreak > MAX_FULLTEXT_CHARS - 500 ? slice.slice(0, lastBreak) : slice).trim();
}
