// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen } from "@testing-library/react";
import "@/lib/i18n";
import type { ProviderConfigView } from "@/lib/api/providers";
import { ProvidersSection } from "./ProvidersSection";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

function stubProviders(list: ProviderConfigView[]) {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () =>
      Promise.resolve(
        new Response(JSON.stringify(list), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
      ),
    ),
  );
}

function renderSection() {
  return render(
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
    >
      <ProvidersSection />
    </QueryClientProvider>,
  );
}

const chat: ProviderConfigView = {
  id: "pc_chat",
  name: "Chat",
  type: "openai-compatible",
  baseUrl: "https://api.openai.com/v1",
  chatModel: "gpt-4o-mini",
  embeddingModel: null,
  enabled: true,
  hasApiKey: true,
  createdAt: "2026-06-22T00:00:00.000Z",
  updatedAt: "2026-06-22T00:00:00.000Z",
};

const embed: ProviderConfigView = {
  id: "pc_embed",
  name: "Embedding",
  type: "ollama",
  baseUrl: "http://127.0.0.1:11434",
  chatModel: null,
  embeddingModel: "nomic-embed-text",
  enabled: true,
  hasApiKey: false,
  createdAt: "2026-06-22T00:00:00.000Z",
  updatedAt: "2026-06-22T00:00:00.000Z",
};

describe("ProvidersSection", () => {
  it("renders separate chat and embedding cards plus the data-egress disclosure", async () => {
    stubProviders([]);
    renderSection();
    expect(await screen.findByText("Chat model")).toBeTruthy();
    expect(screen.getByText("Embedding model")).toBeTruthy();
    expect(screen.getByText(/snippets of your saved content are sent/i)).toBeTruthy();
    // One Save button per card.
    expect(screen.getAllByText("Save")).toHaveLength(2);
  });

  it("prefills the chat card from an existing chat provider and offers a connection test", async () => {
    stubProviders([chat]);
    renderSection();
    expect(await screen.findByDisplayValue("https://api.openai.com/v1")).toBeTruthy();
    expect(screen.getByDisplayValue("gpt-4o-mini")).toBeTruthy();
    expect(screen.getByText(/A key is saved/i)).toBeTruthy();
    // Test connection exists only on the (chat) card bound to a provider.
    expect(screen.getAllByText("Test connection")).toHaveLength(1);
  });

  it("binds an embedding-only provider to the embedding card with no chat-only test", async () => {
    stubProviders([embed]);
    renderSection();
    expect(await screen.findByDisplayValue("nomic-embed-text")).toBeTruthy();
    // The embedding card has no connection test, and the chat card is unbound.
    expect(screen.queryByText("Test connection")).toBeNull();
  });
});
