import { AIProviderError, type ChatMessage, type SummaryOutput } from "@sourdex/core";

export interface SummaryPromptInput {
  title: string;
  /** Plain-text body of the source to summarize. */
  text: string;
  /** Preferred output language hint (e.g. "en", "zh"); defaults to the source language. */
  lang?: string;
}

const SYSTEM_PROMPT = [
  "You summarize saved web content for a personal knowledge base.",
  "Return ONLY a single JSON object — no Markdown, no code fences, no prose around it.",
  "Use exactly these keys: one_sentence (string), summary (string),",
  "key_points (string[]), useful_for (string[]), risk_notes (string[]), suggested_tags (string[]).",
  "Rules: do not invent facts; never go beyond the source text;",
  "if the content is insufficient, return empty fields and put the reason in one_sentence.",
  "Tags must be short (<= 20 chars), specific, lowercase where natural; avoid generic tags.",
].join(" ");

/** Build chat messages for a structured summary (PRD §14.3). */
export function buildSummaryMessages(input: SummaryPromptInput): ChatMessage[] {
  const langLine = input.lang ? `Write the summary in: ${input.lang}.` : "";
  return [
    { role: "system", content: SYSTEM_PROMPT },
    {
      role: "user",
      content: `${langLine}\nTitle: ${input.title}\n\nContent:\n${input.text}`.trim(),
    },
  ];
}

/** Strip Markdown code fences and surrounding prose, returning the JSON object text. */
function stripToJson(raw: string): string {
  let s = raw.trim();
  const fence = /^```(?:json)?\s*([\s\S]*?)\s*```$/i.exec(s);
  if (fence?.[1]) s = fence[1].trim();
  // Fall back to the outermost {...} if the model added stray text around it.
  if (!s.startsWith("{")) {
    const start = s.indexOf("{");
    const end = s.lastIndexOf("}");
    if (start !== -1 && end > start) s = s.slice(start, end + 1);
  }
  return s;
}

function asString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((v): v is string => typeof v === "string" && v.trim().length > 0);
}

/**
 * Parse and normalize a model's summary response into `SummaryOutput` (PRD §14.3, §21.1).
 * Accepts snake_case (per PRD) or camelCase keys, tolerates code fences, and throws
 * `AIProviderError` when the response is not a JSON object.
 */
export function parseSummaryOutput(content: string): SummaryOutput {
  let parsed: unknown;
  try {
    parsed = JSON.parse(stripToJson(content));
  } catch (cause) {
    throw new AIProviderError("AI summary response was not valid JSON", { cause });
  }
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    throw new AIProviderError("AI summary response was not a JSON object");
  }
  const obj = parsed as Record<string, unknown>;
  return {
    oneSentence: asString(obj.one_sentence ?? obj.oneSentence),
    summary: asString(obj.summary),
    keyPoints: asStringArray(obj.key_points ?? obj.keyPoints),
    usefulFor: asStringArray(obj.useful_for ?? obj.usefulFor),
    riskNotes: asStringArray(obj.risk_notes ?? obj.riskNotes),
    suggestedTags: asStringArray(obj.suggested_tags ?? obj.suggestedTags),
  };
}
