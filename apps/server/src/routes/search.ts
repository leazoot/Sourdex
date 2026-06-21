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

/** Search API (PRD §13.3). v0.1 implements keyword mode; semantic/hybrid are v0.2. */
export function registerSearchRoutes(app: FastifyInstance, container: Container): void {
  app.get("/api/search", async (request) => {
    const query = searchQuerySchema.parse(request.query);
    return container.searchService.search(query);
  });
}
