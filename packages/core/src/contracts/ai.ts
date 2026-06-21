/** AI provider contracts (PRD §14.2). Reserved in v0.1; implemented in packages/ai (v0.2). */

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ChatInput {
  messages: ChatMessage[];
  model?: string;
  temperature?: number;
}

export interface ChatOutput {
  content: string;
  model: string;
}

/** Chat/completion LLM provider (Adapter pattern, PRD §10.2). */
export interface LLMProvider {
  chat(input: ChatInput): Promise<ChatOutput>;
}

export interface EmbedInput {
  input: string[];
  model?: string;
}

export interface EmbedOutput {
  vectors: number[][];
  model: string;
}

/** Embedding provider for semantic search (PRD §14.6). */
export interface EmbeddingProvider {
  embed(input: EmbedInput): Promise<EmbedOutput>;
}
