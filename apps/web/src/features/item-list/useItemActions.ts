import type { Item } from "@sourdex/core";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDeleteItem, useUpdateItem } from "@/hooks/useItems";

/** Shared open/archive/delete handlers for item lists (Inbox, Library). */
export function useItemActions() {
  const navigate = useNavigate();
  const update = useUpdateItem();
  const del = useDeleteItem();
  const [pendingDelete, setPendingDelete] = useState<Item | null>(null);

  return {
    onOpen: (id: string) => navigate(`/reader/${id}`),
    onArchive: (item: Item) =>
      update.mutate({
        id: item.id,
        patch: { status: item.status === "archived" ? "inbox" : "archived" },
      }),
    onDelete: (item: Item) => setPendingDelete(item),
    pendingDelete,
    confirmDelete: () => {
      if (pendingDelete) del.mutate(pendingDelete.id);
      setPendingDelete(null);
    },
    cancelDelete: () => setPendingDelete(null),
  };
}
