import {
  AIProviderError,
  type EmbeddingProvider,
  type LLMProvider,
  type ProviderConfig,
  type ProviderType,
} from "@sourdex/core";
import type { FetchLike, HttpResponse } from "./http.js";
import { OpenAICompatibleProvider } from "./providers/openai-compatible.js";
import { OllamaProvider } from "./providers/ollama.js";

export interface ProviderFactoryOptions {
  /** Plaintext API key, fetched from the SecretStore by the caller. */
  apiKey?: string;
  /** Injectable fetch (DI); defaults to the global `fetch`. */
  fetchFn?: FetchLike;
}

/** Adapter implementing both capability interfaces. */
type DualProvider = LLMProvider & EmbeddingProvider;

const defaultFetch: FetchLike = (url, init) => fetch(url, init) as unknown as Promise<HttpResponse>;

/** Provider types implemented in v0.2 (PRD §14.2). */
const IMPLEMENTED: ReadonlySet<ProviderType> = new Set<ProviderType>([
  "openai-compatible",
  "lm-studio",
  "ollama",
]);

function build(config: ProviderConfig, options: ProviderFactoryOptions): DualProvider {
  const fetchFn = options.fetchFn ?? defaultFetch;
  if (config.type === "ollama") {
    return new OllamaProvider({
      baseUrl: config.baseUrl ?? undefined,
      chatModel: config.chatModel ?? undefined,
      embeddingModel: config.embeddingModel ?? undefined,
      fetchFn,
    });
  }
  if (config.type === "openai-compatible" || config.type === "lm-studio") {
    if (!config.baseUrl) throw new AIProviderError(`Provider "${config.name}" has no base URL`);
    return new OpenAICompatibleProvider({
      baseUrl: config.baseUrl,
      apiKey: options.apiKey,
      chatModel: config.chatModel ?? undefined,
      embeddingModel: config.embeddingModel ?? undefined,
      fetchFn,
    });
  }
  throw new AIProviderError(`Provider type "${config.type}" is not implemented yet`);
}

/** Whether the factory can build a working provider for this config type (PRD §14.2). */
export function isProviderImplemented(type: ProviderType): boolean {
  return IMPLEMENTED.has(type);
}

/** Factory: build a chat LLM provider from config + secret (PRD §10.3 createLLMProvider). */
export function createLLMProvider(
  config: ProviderConfig,
  options: ProviderFactoryOptions = {},
): LLMProvider {
  return build(config, options);
}

/** Factory: build an embedding provider from config + secret. */
export function createEmbeddingProvider(
  config: ProviderConfig,
  options: ProviderFactoryOptions = {},
): EmbeddingProvider {
  return build(config, options);
}
