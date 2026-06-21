import {
  AIProviderError,
  type ChatInput,
  type ChatOutput,
  type EmbedInput,
  type EmbedOutput,
  type EmbeddingProvider,
  type LLMProvider,
} from "@sourdex/core";
import { postJson, readString, type FetchLike } from "../http.js";

export interface OpenAICompatibleOptions {
  /** API base URL, e.g. `https://api.openai.com/v1`. */
  baseUrl: string;
  apiKey?: string;
  chatModel?: string;
  embeddingModel?: string;
  fetchFn: FetchLike;
}

/**
 * Adapter for OpenAI-compatible HTTP APIs (OpenAI, LM Studio, many local servers).
 * Implements both chat and embeddings (PRD §14.2). API key is sent as a Bearer header
 * and never logged.
 */
export class OpenAICompatibleProvider implements LLMProvider, EmbeddingProvider {
  constructor(private readonly options: OpenAICompatibleOptions) {}

  private headers(): Record<string, string> {
    return this.options.apiKey ? { Authorization: `Bearer ${this.options.apiKey}` } : {};
  }

  private url(path: string): string {
    return `${this.options.baseUrl.replace(/\/$/, "")}${path}`;
  }

  async chat(input: ChatInput): Promise<ChatOutput> {
    const model = input.model ?? this.options.chatModel;
    if (!model) throw new AIProviderError("No chat model configured");
    const body = await postJson(
      this.options.fetchFn,
      this.url("/chat/completions"),
      this.headers(),
      {
        model,
        messages: input.messages,
        temperature: input.temperature,
      },
    );
    const content = readString(body, "choices", "0", "message", "content");
    if (content === undefined) {
      throw new AIProviderError("AI provider response missing chat content");
    }
    return { content, model: readString(body, "model") ?? model };
  }

  async embed(input: EmbedInput): Promise<EmbedOutput> {
    const model = input.model ?? this.options.embeddingModel;
    if (!model) throw new AIProviderError("No embedding model configured");
    const body = await postJson(this.options.fetchFn, this.url("/embeddings"), this.headers(), {
      model,
      input: input.input,
    });
    const vectors = extractEmbeddings(body);
    return { vectors, model: readString(body, "model") ?? model };
  }
}

/** Read `data[].embedding` arrays from an OpenAI embeddings response. */
function extractEmbeddings(body: unknown): number[][] {
  const data =
    typeof body === "object" && body !== null ? (body as Record<string, unknown>).data : undefined;
  if (!Array.isArray(data)) throw new AIProviderError("AI provider response missing embeddings");
  return data.map((row) => {
    const embedding = (row as Record<string, unknown>)?.embedding;
    if (!Array.isArray(embedding) || !embedding.every((n) => typeof n === "number")) {
      throw new AIProviderError("AI provider returned a malformed embedding");
    }
    return embedding as number[];
  });
}
