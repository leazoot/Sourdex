import type { FastifyInstance } from "fastify";
import { z } from "zod";
import type { Container } from "../container.js";

// v0.1 implements markdown + obsidian (PRD §5.1.7); json/csv are v0.2.
const exportSchema = z.object({
  itemIds: z.array(z.string().min(1)).min(1),
  format: z.enum(["markdown", "obsidian"]).default("markdown"),
});

/** Export API (PRD §13.5). POST /api/export/markdown. */
export function registerExportRoutes(app: FastifyInstance, container: Container): void {
  app.post("/api/export/markdown", async (request) => {
    const body = exportSchema.parse(request.body);
    return container.exportService.export(body);
  });
}
