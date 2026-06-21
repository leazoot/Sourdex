import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { NotFoundError } from "@sourdex/core";
import type { Container } from "../container.js";

const idParamSchema = z.object({ itemId: z.string().min(1) });

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
}
