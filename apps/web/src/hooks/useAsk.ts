import { useMutation } from "@tanstack/react-query";
import { askQuestion, type AskBody } from "@/lib/api/ask";

/** Ask a grounded question over saved sources (PRD §5.2.4). One-shot mutation. */
export function useAsk() {
  return useMutation({ mutationFn: (body: AskBody) => askQuestion(body) });
}
