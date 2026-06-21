/**
 * Remove non-content noise from a parsed document before Readability runs.
 *
 * Lazy / virtual-scroll pages (forums, infinite feeds) leave behind skeleton and
 * placeholder shells for not-yet-loaded items. Readability otherwise picks these up as
 * byline-only stubs, polluting the extracted text (see PRD §26.1 extraction fallback).
 * This pre-clean is conservative: it only drops elements whose class/id tokens clearly
 * mark them as placeholders/skeletons/loaders, plus non-content tags.
 */

const DROP_TAGS = ["script", "style", "noscript", "template"];

// Matched against individual class/id tokens (not the whole attribute), so "downloading"
// or "preloading-tips" won't trip the "loading" rule.
const NOISE_WORDS = ["placeholder", "skeleton", "ghost", "spinner", "shimmer", "loading"];
const NOISE_TOKEN = new RegExp(
  `^(?:${NOISE_WORDS.join("|")})$|[-_](?:${NOISE_WORDS.join("|")})$|^(?:${NOISE_WORDS.join("|")})[-_]`,
  "i",
);

function isNoiseToken(token: string): boolean {
  return NOISE_TOKEN.test(token);
}

/** Strip placeholder/skeleton/loader shells and non-content tags from the document body. */
export function precleanDocument(document: Document): void {
  const body = document.body;
  if (!body) return;

  for (const tag of DROP_TAGS) {
    body.querySelectorAll(tag).forEach((node) => node.remove());
  }

  body.querySelectorAll("[class],[id]").forEach((el) => {
    // getAttribute (not .className) so SVG elements with an animated className still work.
    const tokens = `${el.getAttribute("class") ?? ""} ${el.getAttribute("id") ?? ""}`
      .split(/\s+/)
      .filter(Boolean);
    if (tokens.some(isNoiseToken)) el.remove();
  });
}
