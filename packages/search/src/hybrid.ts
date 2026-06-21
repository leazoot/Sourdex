/** Hybrid ranking — combine keyword/semantic/tag/recency/signal scores (PRD §15.3). */

/** Weights for the final hybrid score (PRD §15.3). Sum to 1.0. */
export const HYBRID_WEIGHTS = {
  keyword: 0.4,
  semantic: 0.35,
  tag: 0.1,
  recency: 0.1,
  userSignal: 0.05,
} as const;

/** Per-item signal scores, each normalized to roughly 0..1. Missing signals count as 0. */
export interface HybridSignals {
  keywordScore?: number;
  semanticScore?: number;
  tagScore?: number;
  recencyScore?: number;
  userSignalScore?: number;
}

/** Weighted blend of the available signals into a single relevance score (PRD §15.3). */
export function hybridScore(s: HybridSignals): number {
  const w = HYBRID_WEIGHTS;
  return (
    w.keyword * (s.keywordScore ?? 0) +
    w.semantic * (s.semanticScore ?? 0) +
    w.tag * (s.tagScore ?? 0) +
    w.recency * (s.recencyScore ?? 0) +
    w.userSignal * (s.userSignalScore ?? 0)
  );
}

/** Recency half-life: a save this old scores 0.5 (PRD §15.3 recency_score). */
const RECENCY_HALF_LIFE_DAYS = 30;
const MS_PER_DAY = 86_400_000;

/** Exponential-decay recency score in (0,1]: 1.0 for "just now", 0.5 at the half-life. */
export function recencyScore(savedAtIso: string, nowMs: number): number {
  const saved = Date.parse(savedAtIso);
  if (!Number.isFinite(saved)) return 0;
  const ageDays = Math.max(0, (nowMs - saved) / MS_PER_DAY);
  return Math.pow(0.5, ageDays / RECENCY_HALF_LIFE_DAYS);
}

/**
 * Tag score: fraction of query tokens that appear in any of the item's tags (PRD §15.3
 * tag_score). Tokens and tag names are compared after lowercasing; a token matches if a
 * tag contains it as a substring (so "react" matches the tag "react hooks").
 */
export function tagScore(queryTokens: readonly string[], tagNames: readonly string[]): number {
  if (queryTokens.length === 0 || tagNames.length === 0) return 0;
  const tags = tagNames.map((t) => t.toLowerCase());
  let hits = 0;
  for (const raw of queryTokens) {
    const token = raw.toLowerCase();
    if (token && tags.some((tag) => tag.includes(token))) hits++;
  }
  return hits / queryTokens.length;
}

/**
 * Normalize similarity scores (e.g. cosine) to 0..1 relative to the best in the set, so
 * the strongest semantic hit scores 1.0 — comparable to the keyword score scale before
 * the weighted blend. Non-positive inputs map to 0.
 */
export function normalizeSimilarities(scores: readonly number[]): number[] {
  const max = Math.max(0, ...scores);
  if (max <= 0) return scores.map(() => 0);
  return scores.map((s) => (s > 0 ? s / max : 0));
}
