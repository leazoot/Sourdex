import type { FastifyInstance } from "fastify";
import { z } from "zod";
import type { Container } from "../container.js";

const SOURCE_TYPES = ["webpage", "selection", "pdf", "video", "screenshot"] as const;

const searchQuerySchema = z.object({
  q: z.string().min(1),
  type: z.enum(SOURCE_TYPES).optional(),
  tag: z.string().optional(),
  domain: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  mode: z.enum(["keyword", "semantic", "hybrid"]).optional(),
  sort: z.enum(["relevance", "newest", "oldest"]).optional(),
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().positive().max(50).optional(),
});

const semanticQuerySchema = z.object({
  q: z.string().min(1),
  limit: z.coerce.number().int().positive().max(50).optional(),
});

/**
 * Search API (PRD §13.3). Keyword mode is v0.1; semantic mode (v0.2) is exposed at a
 * dedicated endpoint and requires an enabled embedding provider (AI opt-in, PRD §17.1).
 * Hybrid ranking that merges both is STAGE-16.
 */
export function registerSearchRoutes(app: FastifyInstance, container: Container): void {
  app.get("/api/search", async (request) => {
    const query = searchQuerySchema.parse(request.query);
    return container.searchService.search(query);
  });

  app.get("/api/search/semantic", async (request, reply) => {
    const { q, limit } = semanticQuerySchema.parse(request.query);
    if (!container.semanticSearchService.enabledProvider()) {
      reply.code(409).send({
        error: "NO_AI_PROVIDER",
        message: "Enable an AI provider with an embedding model to use semantic search.",
      });
      return;
    }
    const results = await container.semanticSearchService.search(q, { limit });
    return { results };
  });
}
