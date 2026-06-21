import type { AskResult, AskScope } from "@sourdex/core";
import { apiFetch } from "./client";

export interface AskBody {
  question: string;
  scope?: AskScope;
}

/** POST /api/ask — grounded Q&A over saved sources with mandatory citations (PRD §13.4). */
export function askQuestion(body: AskBody): Promise<AskResult> {
  return apiFetch<AskResult>("/api/ask", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}
