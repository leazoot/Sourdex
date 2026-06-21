import type { Capture, Item, ItemListQuery, Paginated, Tag, UpdateItemInput } from "@sourdex/core";
import { apiFetch } from "./client";

/** Full item view from GET /api/items/:id (mirrors the server's ItemDetail). */
export interface ItemDetail {
  item: Item;
  capture: Capture | null;
  tags: Tag[];
}

/** Readable content from GET /api/items/:id/content (added in TASK-037). */
export interface ItemContent {
  markdown: string | null;
  readableHtml: string | null;
  plainText: string | null;
}

export interface StatusResponse {
  status: "ok";
  version: string;
  dataDir: string;
  host: string;
  port: number;
}

function toQueryString(query: ItemListQuery): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null && value !== "") params.set(key, String(value));
  }
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export function listItems(query: ItemListQuery = {}): Promise<Paginated<Item>> {
  return apiFetch<Paginated<Item>>(`/api/items${toQueryString(query)}`);
}

export function getItem(id: string): Promise<ItemDetail> {
  return apiFetch<ItemDetail>(`/api/items/${id}`);
}

export function getItemContent(id: string): Promise<ItemContent> {
  return apiFetch<ItemContent>(`/api/items/${id}/content`);
}

export function updateItem(id: string, patch: UpdateItemInput): Promise<Item> {
  return apiFetch<Item>(`/api/items/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
}

export function deleteItem(id: string): Promise<{ id: string; status: "deleted" }> {
  return apiFetch(`/api/items/${id}`, { method: "DELETE" });
}

export function getStatus(): Promise<StatusResponse> {
  return apiFetch<StatusResponse>("/api/status");
}
