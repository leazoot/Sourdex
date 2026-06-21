import type { Tag, TagWithCount } from "@sourdex/core";
import { apiFetch } from "./client";

/** Tag management API (PRD §6.2 Tags page). */
export function listTags(): Promise<TagWithCount[]> {
  return apiFetch<{ tags: TagWithCount[] }>("/api/tags").then((r) => r.tags);
}

export function renameTag(id: string, name: string): Promise<{ tag: Tag; merged: boolean }> {
  return apiFetch(`/api/tags/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
}

export function mergeTag(id: string, targetId: string): Promise<{ tag: Tag }> {
  return apiFetch(`/api/tags/${id}/merge`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ targetId }),
  });
}

export function deleteTag(id: string): Promise<void> {
  return apiFetch(`/api/tags/${id}`, { method: "DELETE" });
}
