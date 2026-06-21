import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { deleteTag, listTags, mergeTag, renameTag } from "@/lib/api/tags";
import { queryKeys } from "@/lib/api/query-keys";

/** All tags with usage counts (PRD §6.2). */
export function useTags() {
  return useQuery({ queryKey: queryKeys.tags(), queryFn: listTags });
}

function useTagMutation<T>(fn: (vars: T) => Promise<unknown>) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: () => void qc.invalidateQueries({ queryKey: queryKeys.tags() }),
  });
}

export function useRenameTag() {
  return useTagMutation(({ id, name }: { id: string; name: string }) => renameTag(id, name));
}

export function useMergeTag() {
  return useTagMutation(({ id, targetId }: { id: string; targetId: string }) =>
    mergeTag(id, targetId),
  );
}

export function useDeleteTag() {
  return useTagMutation((id: string) => deleteTag(id));
}
