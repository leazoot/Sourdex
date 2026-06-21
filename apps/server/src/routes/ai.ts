import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { NotFoundError } from "@sourdex/core";
import type { Container } from "../container.js";

const idParamSchema = z.object({ itemId: z.string().min(1) });

const SOURCE_TYPES = ["webpage", "selection", "pdf", "video", "screenshot"] as const;
const askSchema = z.object({
  question: z.string().min(1).max(2000),
  scope: z
    .object({
      type: z.enum(["all", ...SOURCE_TYPES]).optional(),
      tagIds: z.array(z.string()).optional(),
      itemIds: z.array(z.string()).optional(),
    })
    .optional(),
});

/**
 * AI feature endpoints (PRD §13.4). AI is opt-in: summarize is only available when the
 * user has an enabled provider (PRD §14.1, §17.1). Work runs as a background job so it
 * never blocks the request (PRD §18.1).
 */
export function registerAiRoutes(app: FastifyInstance, container: Container): void {
  app.post("/api/ai/summarize/:itemId", async (request, reply) => {
    const { itemId } = idParamSchema.parse(request.params);

    const item = container.itemRepo.findById(itemId);
    if (!item) throw new NotFoundError(`Item not found: ${itemId}`);

    if (!container.summaryService.enabledProvider()) {
      reply.code(409).send({
        error: "NO_AI_PROVIDER",
        message: "Enable an AI provider in Settings to use summaries.",
      });
      return;
    }

    container.itemRepo.setAiStatus(itemId, "pending");
    const job = container.jobRepo.create({ type: "generate_summary", payload: { itemId } });
    reply.code(202);
    return { jobId: job.id, status: "pending" as const };
  });

  app.post("/api/ai/embed/:itemId", async (request, reply) => {
    const { itemId } = idParamSchema.parse(request.params);

    const item = container.itemRepo.findById(itemId);
    if (!item) throw new NotFoundError(`Item not found: ${itemId}`);

    if (!container.embeddingService.enabledProvider()) {
      reply.code(409).send({
        error: "NO_AI_PROVIDER",
        message: "Enable an AI provider with an embedding model to build the semantic index.",
      });
      return;
    }

    const job = container.jobRepo.create({ type: "generate_embedding", payload: { itemId } });
    reply.code(202);
    return { jobId: job.id, status: "pending" as const };
  });

  app.post("/api/ask", async (request, reply) => {
    const { question, scope } = askSchema.parse(request.body);

    if (!container.askService.enabledProvider()) {
      reply.code(409).send({
        error: "NO_AI_PROVIDER",
        message: "Enable an AI provider in Settings to ask questions.",
      });
      return;
    }

    return container.askService.ask(question, scope ?? {});
  });
}
