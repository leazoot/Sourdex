import type { FastifyInstance } from "fastify";
import { z } from "zod";
import type { Container } from "../container.js";

const SOURCE_TYPES = ["webpage", "selection", "pdf", "video", "screenshot"] as const;
const ITEM_STATUSES = ["inbox", "read", "archived", "deleted"] as const;

const listQuerySchema = z.object({
  status: z.enum(ITEM_STATUSES).optional(),
  type: z.enum(SOURCE_TYPES).optional(),
  tag: z.string().optional(),
  domain: z.string().optional(),
  q: z.string().optional(),
  sort: z.enum(["newest", "oldest", "relevance", "title"]).optional(),
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().positive().max(100).optional(),
});

const idParamSchema = z.object({ id: z.string().min(1) });

const updateItemSchema = z.object({
  title: z.string().min(1).optional(),
  status: z.enum(ITEM_STATUSES).optional(),
  summary: z.string().nullable().optional(),
  oneSentence: z.string().nullable().optional(),
});

/** Item API (PRD §13.2). */
export function registerItemRoutes(app: FastifyInstance, container: Container): void {
  app.get("/api/items", async (request) => {
    const query = listQuerySchema.parse(request.query);
    return container.itemService.list(query);
  });

  app.get("/api/items/:id", async (request) => {
    const { id } = idParamSchema.parse(request.params);
    return container.itemService.get(id);
  });

  app.get("/api/items/:id/content", async (request) => {
    const { id } = idParamSchema.parse(request.params);
    return container.itemService.getContent(id);
  });

  app.patch("/api/items/:id", async (request) => {
    const { id } = idParamSchema.parse(request.params);
    const body = updateItemSchema.parse(request.body);
    return container.itemService.update(id, body);
  });

  app.delete("/api/items/:id", async (request) => {
    const { id } = idParamSchema.parse(request.params);
    container.itemService.softDelete(id);
    return { id, status: "deleted" as const };
  });
}
