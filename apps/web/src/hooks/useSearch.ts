import type { SearchInput } from "@sourdex/core";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { searchItems } from "@/lib/api/search";
import { queryKeys } from "@/lib/api/query-keys";

/** Keyword search hook. Disabled until there is a non-empty query (PRD §15). */
export function useSearch(params: SearchInput) {
  const enabled = params.q.trim().length > 0;
  return useQuery({
    queryKey: queryKeys.search(params),
    queryFn: () => searchItems(params),
    enabled,
    placeholderData: keepPreviousData,
  });
}
