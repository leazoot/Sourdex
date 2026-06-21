import { cosineSimilarity, type ProviderConfig, type SourceType } from "@sourdex/core";
import type { ChunkRepository, SearchRepository } from "@sourdex/db";
import type { EmbeddingService } from "./embedding-service.js";

/** Max characters of chunk text returned as a citation snippet (PRD §5.2.3.5). */
const SNIPPET_CHARS = 280;

export interface SemanticSearchHit {
  itemId: string;
  title: string;
  url: string | null;
  domain: string | null;
  type: SourceType;
  savedAt: string;
  /** The matched chunk — makes the result traceable to the source passage (PRD §5.2.3.5). */
  chunkId: string;
  snippet: string;
  /** Cosine similarity in [-1, 1]. */
  score: number;
}

export interface SemanticSearchServiceDeps {
  embeddingService: EmbeddingService;
  searchRepo: SearchRepository;
  chunkRepo: ChunkRepository;
}

/**
 * Semantic (vector) search (PRD §15.1). Embeds the query, then ranks stored chunk
 * embeddings by cosine similarity (brute force — fine at v0.2 scale; an ANN index such
 * as sqlite-vec is a future optimization, OQ-A9). Soft-deleted items are excluded at the
 * repository layer. Each hit carries its chunk so results trace back to the source
 * passage (PRD §5.2.3.5).
 */
export class SemanticSearchService {
  constructor(private readonly deps: SemanticSearchServiceDeps) {}

  /** The enabled embedding provider, or null when semantic search is unavailable. */
  enabledProvider(): ProviderConfig | null {
    return this.deps.embeddingService.enabledProvider();
  }

  async search(query: string, options: { limit?: number } = {}): Promise<SemanticSearchHit[]> {
    const limit = Math.max(1, Math.min(options.limit ?? 10, 50));
    const trimmed = query.trim();
    if (!trimmed) return [];

    const queryVec = await this.deps.embeddingService.embedQuery(trimmed);
    if (!queryVec) return [];

    // Keep the best-scoring chunk per item so results aren't dominated by one document.
    const best = new Map<string, SemanticSearchHit>();
    for (const row of this.deps.searchRepo.listEmbeddingCandidates()) {
      const parsed = safeParse(row.output);
      if (!parsed) continue;
      const score = cosineSimilarity(queryVec, parsed.vector);
      if (score <= 0) continue;
      const existing = best.get(row.itemId);
      if (existing && existing.score >= score) continue;
      best.set(row.itemId, {
        itemId: row.itemId,
        title: row.title,
        url: row.url,
        domain: row.domain,
        type: row.type,
        savedAt: row.savedAt,
        chunkId: parsed.chunkId,
        snippet: "",
        score,
      });
    }

    const top = [...best.values()].sort((a, b) => b.score - a.score).slice(0, limit);
    for (const hit of top) {
      hit.snippet = this.deps.chunkRepo.findById(hit.chunkId)?.text.slice(0, SNIPPET_CHARS) ?? "";
    }
    return top;
  }
}

function safeParse(output: string): { chunkId: string; vector: number[] } | null {
  try {
    const value = JSON.parse(output) as { chunkId?: unknown; vector?: unknown };
    if (typeof value.chunkId !== "string" || !Array.isArray(value.vector)) return null;
    return { chunkId: value.chunkId, vector: value.vector as number[] };
  } catch {
    return null;
  }
}
