/** Vector math for semantic search (PRD §15.1 semantic, §14.6). */

/**
 * Cosine similarity in [-1, 1] between two equal-length vectors. Returns 0 when the
 * lengths differ (e.g. embeddings from a different model/dimension) or either vector is
 * zero — callers treat such pairs as "no match" rather than erroring, so a model change
 * degrades gracefully until the index is rebuilt (PRD §14.6 rule 5, §5.2.3.7).
 */
export function cosineSimilarity(a: readonly number[], b: readonly number[]): number {
  if (a.length === 0 || a.length !== b.length) return 0;
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    const ai = a[i] ?? 0;
    const bi = b[i] ?? 0;
    dot += ai * bi;
    normA += ai * ai;
    normB += bi * bi;
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}
