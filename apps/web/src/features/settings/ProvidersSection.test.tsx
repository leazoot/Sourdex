// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
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

const sample: ProviderConfigView = {
  id: "pc_1",
  name: "My OpenAI",
  type: "openai-compatible",
  baseUrl: "https://api.openai.com/v1",
  chatModel: "gpt-4o-mini",
  embeddingModel: null,
  enabled: false,
  hasApiKey: true,
  createdAt: "2026-06-21T00:00:00.000Z",
  updatedAt: "2026-06-21T00:00:00.000Z",
};

describe("ProvidersSection", () => {
  it("shows the empty state and the data-egress disclosure when no providers exist", async () => {
    stubProviders([]);
    renderSection();
    expect(await screen.findByText(/No providers yet/i)).toBeTruthy();
    expect(screen.getByText(/snippets of your saved content are sent/i)).toBeTruthy();
    expect(screen.getByText("Add provider")).toBeTruthy();
  });

  it("opens the add form with both implemented provider types", async () => {
    stubProviders([]);
    renderSection();
    fireEvent.click(await screen.findByText("Add provider"));
    expect(screen.getByText("OpenAI-compatible")).toBeTruthy();
    expect(screen.getByText("Ollama")).toBeTruthy();
  });

  it("renders a configured provider with its key badge and actions", async () => {
    stubProviders([sample]);
    renderSection();
    expect(await screen.findByText("My OpenAI")).toBeTruthy();
    expect(screen.getByText("Key saved")).toBeTruthy();
    expect(screen.getByText("Test connection")).toBeTruthy();
  });
});
