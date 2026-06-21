import type { FastifyInstance } from "fastify";
import { z } from "zod";
import type { Container } from "../container.js";

// Markdown / Obsidian / JSON / CSV (PRD §8.9). Items come from an explicit list or a scope.
const scopeSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("all") }),
  z.object({ type: z.literal("status"), status: z.enum(["inbox", "read", "archived"]) }),
  z.object({ type: z.literal("tag"), tagId: z.string().min(1) }),
]);

const exportSchema = z
  .object({
    itemIds: z.array(z.string().min(1)).min(1).optional(),
    scope: scopeSchema.optional(),
    format: z.enum(["markdown", "obsidian", "json", "csv"]).default("markdown"),
  })
  .refine((body) => Boolean(body.itemIds) || Boolean(body.scope), {
    message: "Provide either itemIds or scope",
  });

/** Export API (PRD §13.5). POST /api/export/markdown handles all formats. */
export function registerExportRoutes(app: FastifyInstance, container: Container): void {
  app.post("/api/export/markdown", async (request) => {
    const body = exportSchema.parse(request.body);
    return container.exportService.export(body);
  });
}
