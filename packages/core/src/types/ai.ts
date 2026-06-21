/** AI domain types. Mirrors PRD §12.8 `ai_outputs`, §12.9 `provider_configs` (v0.2). */

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
