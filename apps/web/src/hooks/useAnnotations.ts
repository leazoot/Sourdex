import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createAnnotation,
  deleteAnnotation,
  listAnnotations,
  updateAnnotation,
  type CreateAnnotationBody,
} from "@/lib/api/annotations";
import { queryKeys } from "@/lib/api/query-keys";

/** Highlights & notes for an item (PRD §5.2.5). */
export function useAnnotations(itemId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.annotations(itemId ?? ""),
    queryFn: () => listAnnotations(itemId as string),
    enabled: Boolean(itemId),
  });
}

export function useCreateAnnotation(itemId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateAnnotationBody) => createAnnotation(itemId, body),
    onSuccess: () => void qc.invalidateQueries({ queryKey: queryKeys.annotations(itemId) }),
  });
}

export function useUpdateAnnotation(itemId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, note }: { id: string; note: string | null }) =>
      updateAnnotation(id, { note }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: queryKeys.annotations(itemId) }),
  });
}

export function useDeleteAnnotation(itemId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteAnnotation(id),
    onSuccess: () => void qc.invalidateQueries({ queryKey: queryKeys.annotations(itemId) }),
  });
}
