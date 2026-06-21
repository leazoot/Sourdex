import type { FastifyInstance } from "fastify";
import { z } from "zod";
import type { Container } from "../container.js";

const idParam = z.object({ id: z.string().min(1) });
const renameSchema = z.object({ name: z.string().min(1).max(64) });
const mergeSchema = z.object({ targetId: z.string().min(1) });

/** Tag management API (PRD §6.2 Tags page): list with counts, rename, merge, delete. */
export function registerTagRoutes(app: FastifyInstance, container: Container): void {
  app.get("/api/tags", async () => {
    return { tags: container.tagService.list() };
  });

  app.patch("/api/tags/:id", async (request) => {
    const { id } = idParam.parse(request.params);
    const { name } = renameSchema.parse(request.body);
    return container.tagService.rename(id, name);
  });

  app.post("/api/tags/:id/merge", async (request) => {
    const { id } = idParam.parse(request.params);
    const { targetId } = mergeSchema.parse(request.body);
    const tag = await container.tagService.merge(id, targetId);
    return { tag };
  });

  app.delete("/api/tags/:id", async (request, reply) => {
    const { id } = idParam.parse(request.params);
    await container.tagService.delete(id);
    reply.code(204);
  });
}
