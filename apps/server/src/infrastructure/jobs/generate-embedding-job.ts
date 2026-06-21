import type { EmbeddingService } from "../../services/embedding-service.js";
import type { JobHandler } from "./job-worker.js";

/**
 * Build the `generate_embedding` job handler (PRD §10.5, §14.6 — background, low priority).
 * Delegates to EmbeddingService, which swallows provider failures; only infra errors
 * propagate to retry.
 */
export function createGenerateEmbeddingJob(embeddingService: EmbeddingService): JobHandler {
  return async (job) => {
    const payload = JSON.parse(job.payload) as { itemId?: string };
    if (!payload.itemId) throw new Error("generate_embedding payload missing itemId");
    await embeddingService.embedItem(payload.itemId);
  };
}
