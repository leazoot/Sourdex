import type { SearchInput, SearchResult } from "@sourdex/core";
import { apiFetch } from "./client";

/** GET /api/search (PRD §13.3). Keyword mode; `mode=hybrid` blends semantic ranking (v0.2). */
export function searchItems(params: SearchInput): Promise<SearchResult> {
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") qs.set(key, String(value));
  }
  return apiFetch<SearchResult>(`/api/search?${qs.toString()}`);
}
