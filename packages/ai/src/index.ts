/**
 * @sourdex/ai — LLM/Embedding provider adapters + factory (PRD §14.2).
 *
 * v0.2 implements `openai-compatible` / `lm-studio` (OpenAI HTTP shape) and `ollama`.
 * Providers are pure adapters over an injectable `fetch`; the server wires the API key
 * from the SecretStore and never logs it (PRD §17.1). Higher-level summary/tag/RAG flows
 * live in later stages and consume these contracts.
 */
export * from "./http.js";
export * from "./factory.js";
export * from "./summary.js";
export * from "./answer.js";
export { OpenAICompatibleProvider } from "./providers/openai-compatible.js";
export { OllamaProvider } from "./providers/ollama.js";
