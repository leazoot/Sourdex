import type { FastifyInstance } from "fastify";
import { z } from "zod";
import type { Container } from "../container.js";

const itemParam = z.object({ itemId: z.string().min(1) });
const idParam = z.object({ id: z.string().min(1) });

const createSchema = z.object({
  selectedText: z.string().min(1).max(10_000),
  note: z.string().max(10_000).nullish(),
  color: z.string().max(32).nullish(),
  chunkId: z.string().nullish(),
});

const updateSchema = z
  .object({ note: z.string().max(10_000).nullable(), color: z.string().max(32).nullable() })
  .partial();

/**
 * Highlights & notes API (PRD §5.2.5, §13). Highlighting stores selection separately from
 * the source, so the original is never modified (acceptance §5.2.5.1).
 */
export function registerAnnotationRoutes(app: FastifyInstance, container: Container): void {
  app.get("/api/items/:itemId/annotations", async (request) => {
    const { itemId } = itemParam.parse(request.params);
    return { annotations: container.annotationService.listByItem(itemId) };
  });

  app.post("/api/items/:itemId/annotations", async (request, reply) => {
    const { itemId } = itemParam.parse(request.params);
    const body = createSchema.parse(request.body);
    const annotation = await container.annotationService.create(itemId, body);
    reply.code(201);
    return annotation;
  });

  app.patch("/api/annotations/:id", async (request) => {
    const { id } = idParam.parse(request.params);
    const body = updateSchema.parse(request.body);
    return container.annotationService.update(id, body);
  });

  app.delete("/api/annotations/:id", async (request, reply) => {
    const { id } = idParam.parse(request.params);
    await container.annotationService.delete(id);
    reply.code(204);
  });
}
