import { describe, expect, it } from "vitest";
import { AIProviderError, type ProviderConfig, type ProviderType } from "@sourdex/core";
import type { FetchLike, HttpResponse } from "./http.js";
import { createEmbeddingProvider, createLLMProvider, isProviderImplemented } from "./factory.js";
import { OpenAICompatibleProvider } from "./providers/openai-compatible.js";
import { OllamaProvider } from "./providers/ollama.js";

interface Call {
  url: string;
  headers: Record<string, string>;
  body: unknown;
}

/** Mock fetch that records calls and replies with a scripted JSON body (or status). */
function mockFetch(reply: unknown, opts: { ok?: boolean; status?: number } = {}) {
  const calls: Call[] = [];
  const fetchFn: FetchLike = async (url, init) => {
    calls.push({ url, headers: init.headers, body: JSON.parse(init.body) as unknown });
    const res: HttpResponse = {
      ok: opts.ok ?? true,
      status: opts.status ?? 200,
      text: async () => (typeof reply === "string" ? reply : JSON.stringify(reply)),
    };
    return res;
  };
  return { fetchFn, calls };
}

function config(type: ProviderType, over: Partial<ProviderConfig> = {}): ProviderConfig {
  return {
    id: "pc_1",
    name: "Test",
    type,
    baseUrl: "https://api.example.com/v1",
    chatModel: "gpt-test",
    embeddingModel: "embed-test",
    enabled: true,
    createdAt: "2026-06-21T00:00:00.000Z",
    updatedAt: "2026-06-21T00:00:00.000Z",
    ...over,
  };
}

describe("provider factory", () => {
  it("builds the right adapter per type and rejects unimplemented types", () => {
    expect(createLLMProvider(config("openai-compatible"))).toBeInstanceOf(OpenAICompatibleProvider);
    expect(createLLMProvider(config("lm-studio"))).toBeInstanceOf(OpenAICompatibleProvider);
    expect(createEmbeddingProvider(config("ollama", { baseUrl: null }))).toBeInstanceOf(
      OllamaProvider,
    );
    expect(() => createLLMProvider(config("anthropic"))).toThrow(AIProviderError);
    expect(() => createLLMProvider(config("gemini"))).toThrow(AIProviderError);
  });

  it("reports which types are implemented", () => {
    expect(isProviderImplemented("openai-compatible")).toBe(true);
    expect(isProviderImplemented("ollama")).toBe(true);
    expect(isProviderImplemented("anthropic")).toBe(false);
  });

  it("requires a base URL for openai-compatible", () => {
    expect(() => createLLMProvider(config("openai-compatible", { baseUrl: null }))).toThrow(
      AIProviderError,
    );
  });
});

describe("OpenAICompatibleProvider", () => {
  it("maps chat responses and sends a bearer key to /chat/completions", async () => {
    const { fetchFn, calls } = mockFetch({
      model: "gpt-test",
      choices: [{ message: { content: "hello" } }],
    });
    const provider = createLLMProvider(config("openai-compatible"), {
      apiKey: "sk-123",
      fetchFn,
    });
    const out = await provider.chat({ messages: [{ role: "user", content: "hi" }] });
    expect(out).toEqual({ content: "hello", model: "gpt-test" });
    expect(calls[0]!.url).toBe("https://api.example.com/v1/chat/completions");
    expect(calls[0]!.headers.Authorization).toBe("Bearer sk-123");
  });

  it("maps embedding responses", async () => {
    const { fetchFn } = mockFetch({
      model: "embed-test",
      data: [{ embedding: [0.1, 0.2] }, { embedding: [0.3, 0.4] }],
    });
    const provider = createEmbeddingProvider(config("openai-compatible"), { fetchFn });
    const out = await provider.embed({ input: ["a", "b"] });
    expect(out.vectors).toEqual([
      [0.1, 0.2],
      [0.3, 0.4],
    ]);
  });

  it("raises AIProviderError on HTTP error and on missing content", async () => {
    const err = mockFetch("nope", { ok: false, status: 401 });
    const p1 = createLLMProvider(config("openai-compatible"), { fetchFn: err.fetchFn });
    await expect(p1.chat({ messages: [] })).rejects.toBeInstanceOf(AIProviderError);

    const empty = mockFetch({ choices: [] });
    const p2 = createLLMProvider(config("openai-compatible"), { fetchFn: empty.fetchFn });
    await expect(p2.chat({ messages: [] })).rejects.toBeInstanceOf(AIProviderError);
  });

  it("throws when no chat model is configured", async () => {
    const { fetchFn } = mockFetch({});
    const provider = createLLMProvider(config("openai-compatible", { chatModel: null }), {
      fetchFn,
    });
    await expect(provider.chat({ messages: [] })).rejects.toBeInstanceOf(AIProviderError);
  });
});

describe("OllamaProvider", () => {
  it("maps chat responses from /api/chat", async () => {
    const { fetchFn, calls } = mockFetch({ model: "llama-test", message: { content: "hi there" } });
    const provider = createLLMProvider(config("ollama", { baseUrl: "http://127.0.0.1:11434" }), {
      fetchFn,
    });
    const out = await provider.chat({ messages: [{ role: "user", content: "hi" }] });
    expect(out).toEqual({ content: "hi there", model: "llama-test" });
    expect(calls[0]!.url).toBe("http://127.0.0.1:11434/api/chat");
    expect(calls[0]!.headers.Authorization).toBeUndefined();
  });

  it("maps embeddings from /api/embed and defaults the base URL", async () => {
    const { fetchFn, calls } = mockFetch({ embeddings: [[1, 2, 3]] });
    const provider = createEmbeddingProvider(config("ollama", { baseUrl: null }), { fetchFn });
    const out = await provider.embed({ input: ["x"] });
    expect(out.vectors).toEqual([[1, 2, 3]]);
    expect(calls[0]!.url).toBe("http://127.0.0.1:11434/api/embed");
  });
});
