import { useMutation } from "@tanstack/react-query";
import { runExport, type ExportRequest } from "@/lib/api/export";

/** Trigger an export (PRD §5.1.7 / §6.2). Accepts an item list or a scope. */
export function useExport() {
  return useMutation({ mutationFn: (input: ExportRequest) => runExport(input) });
}
