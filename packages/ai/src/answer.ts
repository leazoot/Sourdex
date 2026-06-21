import { AIProviderError, type AnswerConfidence, type ChatMessage } from "@sourdex/core";

/** One numbered evidence passage given to the model (PRD §14.5 context packing). */
export interface AnswerContext {
  /** 1-based citation number the model must cite as "[n]". */
  n: number;
  title: string;
  text: string;
}

export interface AnswerPromptInput {
  question: string;
  contexts: AnswerContext[];
}

/** A model answer after parsing, before citation validation against real chunks. */
export interface ParsedAnswer {
  answer: string;
  citations: { n: number; quote: string }[];
  confidence: AnswerConfidence;
}

const SYSTEM_PROMPT = [
  "You answer questions strictly from the user's saved sources, provided below as numbered passages.",
  "Return ONLY a single JSON object — no Markdown, no code fences, no prose around it.",
  "Keys: answer (string), citations (array of {n: number, quote: string}), confidence ('high'|'medium'|'low').",
  "Rules:",
  "1. Use ONLY facts found in the numbered passages; never use outside knowledge.",
  "2. Every claim must cite its supporting passage inline as [n], and each [n] must appear in citations with a short verbatim quote from that passage.",
  "3. If the passages do not contain enough information, set answer to a brief statement that the saved sources don't cover it, citations to [], and confidence to 'low'.",
  "4. Do not fabricate citations or quotes.",
].join(" ");

/** Build chat messages for a grounded, citation-required answer (PRD §14.5). */
export function buildAnswerMessages(input: AnswerPromptInput): ChatMessage[] {
  const passages = input.contexts.map((c) => `[${c.n}] ${c.title}\n${c.text}`).join("\n\n---\n\n");
  const body = passages || "(no sources available)";
  return [
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user", content: `Question: ${input.question}\n\nSources:\n${body}` },
  ];
}

function stripToJson(raw: string): string {
  let s = raw.trim();
  const fence = /^```(?:json)?\s*([\s\S]*?)\s*```$/i.exec(s);
  if (fence?.[1]) s = fence[1].trim();
  if (!s.startsWith("{")) {
    const start = s.indexOf("{");
    const end = s.lastIndexOf("}");
    if (start !== -1 && end > start) s = s.slice(start, end + 1);
  }
  return s;
}

function asConfidence(value: unknown): AnswerConfidence {
  return value === "high" || value === "medium" || value === "low" ? value : "low";
}

function parseCitations(value: unknown): { n: number; quote: string }[] {
  if (!Array.isArray(value)) return [];
  const out: { n: number; quote: string }[] = [];
  for (const raw of value) {
    if (typeof raw !== "object" || raw === null) continue;
    const obj = raw as Record<string, unknown>;
    const n = typeof obj.n === "number" ? obj.n : Number(obj.n);
    if (!Number.isInteger(n) || n < 1) continue;
    out.push({ n, quote: typeof obj.quote === "string" ? obj.quote : "" });
  }
  return out;
}

/**
 * Parse a model's Ask response into {@link ParsedAnswer} (PRD §14.5, §21.1). Tolerates
 * code fences/surrounding prose; throws `AIProviderError` when the response is not a JSON
 * object. Citation/quote validation against real chunks happens in the AskService.
 */
export function parseAnswerOutput(content: string): ParsedAnswer {
  let parsed: unknown;
  try {
    parsed = JSON.parse(stripToJson(content));
  } catch (cause) {
    throw new AIProviderError("AI answer response was not valid JSON", { cause });
  }
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    throw new AIProviderError("AI answer response was not a JSON object");
  }
  const obj = parsed as Record<string, unknown>;
  return {
    answer: typeof obj.answer === "string" ? obj.answer : "",
    citations: parseCitations(obj.citations),
    confidence: asConfidence(obj.confidence),
  };
}
