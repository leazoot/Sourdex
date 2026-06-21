import type { SummaryService } from "../../services/summary-service.js";
import type { JobHandler } from "./job-worker.js";

/**
 * Build the `generate_summary` job handler (PRD §10.5, §14.3). Delegates to SummaryService,
 * which handles provider/parse failures internally; only infra errors propagate to retry.
 */
export function createGenerateSummaryJob(summaryService: SummaryService): JobHandler {
  return async (job) => {
    const payload = JSON.parse(job.payload) as { itemId?: string };
    if (!payload.itemId) throw new Error("generate_summary payload missing itemId");
    await summaryService.summarizeItem(payload.itemId);
  };
}
