import { apiFetch } from "./client";

/** POST /api/ai/summarize/:itemId — enqueue a background summary job (PRD §13.4). */
export function summarizeItem(itemId: string): Promise<{ jobId: string; status: "pending" }> {
  return apiFetch(`/api/ai/summarize/${itemId}`, { method: "POST" });
}
