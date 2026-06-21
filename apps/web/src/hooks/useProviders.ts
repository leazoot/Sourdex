import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createProvider,
  deleteProvider,
  listProviders,
  testProvider,
  updateProvider,
  type CreateProviderBody,
  type UpdateProviderBody,
} from "@/lib/api/providers";
import { queryKeys } from "@/lib/api/query-keys";

export function useProviders() {
  return useQuery({ queryKey: queryKeys.providers(), queryFn: listProviders, retry: 0 });
}

export function useCreateProvider() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateProviderBody) => createProvider(body),
    onSuccess: () => void qc.invalidateQueries({ queryKey: queryKeys.providers() }),
  });
}

export function useUpdateProvider() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: UpdateProviderBody }) =>
      updateProvider(id, patch),
    onSuccess: () => void qc.invalidateQueries({ queryKey: queryKeys.providers() }),
  });
}

export function useDeleteProvider() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteProvider(id),
    onSuccess: () => void qc.invalidateQueries({ queryKey: queryKeys.providers() }),
  });
}

export function useTestProvider() {
  return useMutation({ mutationFn: (id: string) => testProvider(id) });
}
