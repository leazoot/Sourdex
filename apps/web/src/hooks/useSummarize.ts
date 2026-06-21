import { useMutation, useQueryClient } from "@tanstack/react-query";
import { summarizeItem } from "@/lib/api/ai";
import { queryKeys } from "@/lib/api/query-keys";

/** Trigger a background AI summary and refresh the item once it is enqueued. */
export function useSummarize(itemId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => summarizeItem(itemId ?? ""),
    onSuccess: () => {
      if (itemId) void qc.invalidateQueries({ queryKey: queryKeys.item(itemId) });
    },
  });
}
