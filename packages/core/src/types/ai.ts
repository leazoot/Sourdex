/** AI domain types. Mirrors PRD §12.8 `ai_outputs`, §12.9 `provider_configs` (v0.2). */

import type { SourceType } from "./item.js";

/** Kind of AI output (PRD §12.8 `type`). */
export type AiOutputType = "summary" | "tags" | "embedding" | "answer";

/** AI provider kind (PRD §14.2). v0.2 implements `openai-compatible` and `ollama`. */
export type ProviderType = "openai-compatible" | "ollama" | "anthropic" | "gemini" | "lm-studio";

/** A stored, reproducible AI output keyed by input hash (PRD §12.8). */
export interface AiOutput {
  id: string;
  itemId: string | null;
  type: AiOutputType;
  provider: string;
  model: string;
  inputHash: string;
  /** Serialized JSON output. */
  output: string;
  /** ISO 8601 string. */
  createdAt: string;
}

/**
 * AI provider configuration (PRD §12.9).
 * NOTE: API keys are NEVER stored here in plaintext — they go to Keychain /
 * encrypted storage (PRD §17.2). This record holds non-secret config only.
 */
export interface ProviderConfig {
  id: string;
  name: string;
  type: ProviderType;
  baseUrl: string | null;
  chatModel: string | null;
  embeddingModel: string | null;
  enabled: boolean;
  /** ISO 8601 string. */
  createdAt: string;
  /** ISO 8601 string. */
  updatedAt: string;
}

/** Structured summary output contract (PRD §14.3). Generated in v0.2. */
export interface SummaryOutput {
  oneSentence: string;
  summary: string;
  keyPoints: string[];
  usefulFor: string[];
  riskNotes: string[];
  suggestedTags: string[];
}

/** Model's confidence in an Ask answer (PRD §13.4 response, §5.2.4). */
export type AnswerConfidence = "high" | "medium" | "low";

/** Scope of sources an Ask question runs against (PRD §5.2.4 rule 4, §13.4). */
export interface AskScope {
  /** "all" (default) or a specific source type. */
  type?: SourceType | "all";
  tagIds?: string[];
  itemIds?: string[];
}

/** A validated citation backing an Ask answer — always traces to a saved chunk (PRD §14.5). */
export interface AskCitation {
  /** 1-based index referenced inline in the answer (e.g. "[1]"). */
  n: number;
  itemId: string;
  chunkId: string;
  title: string;
  url: string | null;
  /** Source quote backing the citation (PRD §13.4). */
  quote: string;
}

/** Ask answer with mandatory citations (PRD §5.2.4, §13.4). */
export interface AskResult {
  answer: string;
  citations: AskCitation[];
  confidence: AnswerConfidence;
}
