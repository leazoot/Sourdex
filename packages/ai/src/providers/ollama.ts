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

export interface OllamaOptions {
  /** Ollama base URL; defaults to the local daemon. */
  baseUrl?: string;
  chatModel?: string;
  embeddingModel?: string;
  fetchFn: FetchLike;
}

const DEFAULT_BASE_URL = "http://127.0.0.1:11434";

/**
 * Adapter for a local Ollama daemon (PRD §14.2). No API key (local). Uses the native
 * `/api/chat` and `/api/embed` endpoints with streaming disabled.
 */
export class OllamaProvider implements LLMProvider, EmbeddingProvider {
  private readonly baseUrl: string;

  constructor(private readonly options: OllamaOptions) {
    this.baseUrl = (options.baseUrl ?? DEFAULT_BASE_URL).replace(/\/$/, "");
  }

  async chat(input: ChatInput): Promise<ChatOutput> {
    const model = input.model ?? this.options.chatModel;
    if (!model) throw new AIProviderError("No chat model configured");
    const body = await postJson(
      this.options.fetchFn,
      `${this.baseUrl}/api/chat`,
      {},
      {
        model,
        messages: input.messages,
        stream: false,
        options: input.temperature === undefined ? undefined : { temperature: input.temperature },
      },
    );
    const content = readString(body, "message", "content");
    if (content === undefined) {
      throw new AIProviderError("Ollama response missing chat content");
    }
    return { content, model: readString(body, "model") ?? model };
  }

  async embed(input: EmbedInput): Promise<EmbedOutput> {
    const model = input.model ?? this.options.embeddingModel;
    if (!model) throw new AIProviderError("No embedding model configured");
    const body = await postJson(
      this.options.fetchFn,
      `${this.baseUrl}/api/embed`,
      {},
      {
        model,
        input: input.input,
      },
    );
    const embeddings =
      typeof body === "object" && body !== null
        ? (body as Record<string, unknown>).embeddings
        : undefined;
    if (!Array.isArray(embeddings)) {
      throw new AIProviderError("Ollama response missing embeddings");
    }
    const vectors = embeddings.map((row) => {
      if (!Array.isArray(row) || !row.every((n) => typeof n === "number")) {
        throw new AIProviderError("Ollama returned a malformed embedding");
      }
      return row as number[];
    });
    return { vectors, model: readString(body, "model") ?? model };
  }
}
