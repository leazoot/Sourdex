import type { Annotation } from "@sourdex/core";
import { apiFetch } from "./client";

export interface CreateAnnotationBody {
  selectedText: string;
  note?: string | null;
  color?: string | null;
  chunkId?: string | null;
}

const jsonInit = (method: string, body: unknown) => ({
  method,
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});

/** GET highlights & notes for an item (PRD §5.2.5). */
export function listAnnotations(itemId: string): Promise<{ annotations: Annotation[] }> {
  return apiFetch(`/api/items/${itemId}/annotations`);
}

export function createAnnotation(itemId: string, body: CreateAnnotationBody): Promise<Annotation> {
  return apiFetch(`/api/items/${itemId}/annotations`, jsonInit("POST", body));
}

export function updateAnnotation(
  id: string,
  patch: { note?: string | null; color?: string | null },
): Promise<Annotation> {
  return apiFetch(`/api/annotations/${id}`, jsonInit("PATCH", patch));
}

export function deleteAnnotation(id: string): Promise<void> {
  return apiFetch(`/api/annotations/${id}`, { method: "DELETE" });
}
