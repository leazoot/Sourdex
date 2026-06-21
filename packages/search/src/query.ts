import { CJK_CHAR_CLASS, HIGHLIGHT_CLOSE, HIGHLIGHT_OPEN, segmentCjk } from "@sourdex/core";

export { HIGHLIGHT_OPEN, HIGHLIGHT_CLOSE };

/**
 * Split raw user input into search terms, keeping `"quoted phrases"` intact.
 * Everything outside quotes is split on whitespace.
 */
export function tokenizeQuery(raw: string): string[] {
  const terms: string[] = [];
  const re = /"([^"]*)"|(\S+)/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(raw)) !== null) {
    const term = (match[1] ?? match[2] ?? "").trim();
    if (term) terms.push(term);
  }
  return terms;
}

/**
 * Build a safe FTS5 MATCH expression from raw user input. Each term is CJK-segmented
 * (decision OQ-A7) and emitted as a double-quoted FTS string literal so user input cannot
 * inject FTS operators; terms are AND-combined. Returns null when there is nothing to match.
 */
export function buildMatchExpression(raw: string): string | null {
  const literals = tokenizeQuery(raw)
    .map((term) => segmentCjk(term))
    .filter((term) => term.length > 0)
    .map((term) => `"${term.replace(/"/g, '""')}"`);
  return literals.length > 0 ? literals.join(" ") : null;
}

const MERGE_MARKERS = new RegExp(`${HIGHLIGHT_CLOSE}\\s*${HIGHLIGHT_OPEN}`, "g");
const SPACE_AFTER_CJK = new RegExp(
  `([${CJK_CHAR_CLASS}])\\s+(?=[${CJK_CHAR_CLASS}${HIGHLIGHT_OPEN}${HIGHLIGHT_CLOSE}])`,
  "gu",
);
const SPACE_AFTER_MARKER = new RegExp(
  `([${HIGHLIGHT_OPEN}${HIGHLIGHT_CLOSE}])\\s+(?=[${CJK_CHAR_CLASS}])`,
  "gu",
);

/**
 * Reverse the index-time CJK segmentation in a snippet so Chinese reads naturally again:
 * merge adjacent highlight runs, then drop the spaces inserted between CJK characters
 * (and between CJK and highlight markers). Latin spacing is preserved.
 */
export function cleanSnippet(snippet: string): string {
  return snippet
    .replace(MERGE_MARKERS, "")
    .replace(SPACE_AFTER_CJK, "$1")
    .replace(SPACE_AFTER_MARKER, "$1");
}

/**
 * Normalize FTS5 bm25 ranks (more negative = more relevant) to a 0..1 relevance score
 * relative to the best hit in the set, so the top result scores 1.0 (PRD §15.4).
 */
export function normalizeScores(bm25s: number[]): number[] {
  const best = Math.min(...bm25s);
  if (!Number.isFinite(best) || best === 0) return bm25s.map(() => 1);
  return bm25s.map((bm25) => Math.round((bm25 / best) * 100) / 100);
}
