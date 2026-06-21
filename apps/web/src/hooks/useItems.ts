import type { Item, ItemListQuery, UpdateItemInput } from "@sourdex/core";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  deleteItem,
  getItem,
  getItemContent,
  getStatus,
  listItems,
  updateItem,
} from "@/lib/api/items";
import { queryKeys } from "@/lib/api/query-keys";

export function useItems(query: ItemListQuery = {}) {
  return useQuery({ queryKey: queryKeys.items(query), queryFn: () => listItems(query) });
}

export function useItem(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.item(id ?? ""),
    queryFn: () => getItem(id ?? ""),
    enabled: !!id,
  });
}

export function useItemContent(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.itemContent(id ?? ""),
    queryFn: () => getItemContent(id ?? ""),
    enabled: !!id,
  });
}

export function useStatus() {
  return useQuery({ queryKey: queryKeys.status(), queryFn: getStatus, retry: 0 });
}

export function useUpdateItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: UpdateItemInput }) => updateItem(id, patch),
    onSuccess: (item: Item) => {
      void qc.invalidateQueries({ queryKey: ["items"] });
      void qc.invalidateQueries({ queryKey: queryKeys.item(item.id) });
    },
  });
}

export function useDeleteItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteItem(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["items"] });
    },
  });
}
