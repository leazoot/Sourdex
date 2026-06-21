import type { ItemListQuery, SearchInput } from "@sourdex/core";

/** Centralized TanStack Query cache keys. */
export const queryKeys = {
  items: (query: ItemListQuery = {}) => ["items", query] as const,
  item: (id: string) => ["item", id] as const,
  itemContent: (id: string) => ["item-content", id] as const,
  search: (params: SearchInput) => ["search", params] as const,
  status: () => ["status"] as const,
  providers: () => ["providers"] as const,
};
