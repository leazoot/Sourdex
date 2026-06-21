// @vitest-environment jsdom
import type { Item, SummaryOutput } from "@sourdex/core";
import { afterEach, describe, expect, it, vi } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import "@/lib/i18n";
import type { ProviderConfigView } from "@/lib/api/providers";
import { SummaryPanel } from "./SummaryPanel";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

const item: Item = {
  id: "item_1",
  type: "webpage",
  status: "read",
  title: "T",
  url: "https://x",
  canonicalUrl: null,
  domain: "x",
  author: null,
  publishedAt: null,
  savedAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  summary: null,
  oneSentence: null,
  thumbnailPath: null,
  sourceHash: null,
  wordCount: 1,
  readingTime: 1,
  aiStatus: "none",
};

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

function renderPanel(summary: SummaryOutput | null, it: Item = item) {
  return render(
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
    >
      <SummaryPanel item={it} summary={summary} />
    </QueryClientProvider>,
  );
}

const summary: SummaryOutput = {
  oneSentence: "One.",
  summary: "A real summary body.",
  keyPoints: ["First point", "Second point"],
  usefulFor: [],
  riskNotes: [],
  suggestedTags: [],
};

describe("SummaryPanel", () => {
  it("renders the summary text and numbered key points", () => {
    stubProviders([]);
    renderPanel(summary);
    expect(screen.getByText("A real summary body.")).toBeTruthy();
    expect(screen.getByText("First point")).toBeTruthy();
    expect(screen.getByText("Second point")).toBeTruthy();
    expect(screen.getByText("01")).toBeTruthy();
  });

  it("disables Summarize and shows the hint when no provider is enabled", async () => {
    stubProviders([]);
    renderPanel(null);
    const button = await screen.findByRole("button", { name: "Summarize" });
    expect((button as HTMLButtonElement).disabled).toBe(true);
    expect(screen.getByText(/Enable an AI provider/i)).toBeTruthy();
  });

  it("enables Summarize when a provider is enabled", async () => {
    stubProviders([
      {
        id: "pc_1",
        name: "P",
        type: "ollama",
        baseUrl: null,
        chatModel: null,
        embeddingModel: null,
        enabled: true,
        hasApiKey: false,
        createdAt: "2026-06-21T00:00:00.000Z",
        updatedAt: "2026-06-21T00:00:00.000Z",
      },
    ]);
    renderPanel(null);
    const button = await screen.findByRole("button", { name: "Summarize" });
    await waitFor(() => expect((button as HTMLButtonElement).disabled).toBe(false));
  });

  it("shows the summarizing state while a job is pending", () => {
    stubProviders([]);
    renderPanel(null, { ...item, aiStatus: "pending" });
    expect(screen.getByText("Summarizing…")).toBeTruthy();
  });
});
