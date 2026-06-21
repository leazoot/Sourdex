// @vitest-environment jsdom
import type { AskResult } from "@sourdex/core";
import { afterEach, describe, expect, it, vi } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import "@/lib/i18n";
import type { ProviderConfigView } from "@/lib/api/providers";
import { AskPage } from "./AskPage";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

function json(body: unknown) {
  return Promise.resolve(
    new Response(JSON.stringify(body), {
      status: 200,
      headers: { "content-type": "application/json" },
    }),
  );
}

const enabledProvider: ProviderConfigView = {
  id: "pc_1",
  name: "P",
  type: "ollama",
  baseUrl: null,
  chatModel: "llama3",
  embeddingModel: "nomic",
  enabled: true,
  hasApiKey: false,
  createdAt: "2026-06-21T00:00:00.000Z",
  updatedAt: "2026-06-21T00:00:00.000Z",
};

function stub(providers: ProviderConfigView[], ask: AskResult) {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string) => {
      const u = String(url);
      if (u.includes("/api/settings/providers")) return json(providers);
      if (u.includes("/api/ask")) return json(ask);
      return json({});
    }),
  );
}

function renderAsk() {
  return render(
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
    >
      <MemoryRouter>
        <AskPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

const answer: AskResult = {
  answer: "CRDTs merge deterministically [1].",
  citations: [
    {
      n: 1,
      itemId: "item_1",
      chunkId: "chunk_1",
      title: "CRDT basics",
      url: "https://x",
      quote: "CRDTs merge deterministically",
    },
  ],
  confidence: "high",
};

describe("AskPage", () => {
  it("asks and renders the answer with citation chip and evidence", async () => {
    stub([enabledProvider], answer);
    renderAsk();

    const input = await screen.findByPlaceholderText(/ask your saved sources/i);
    fireEvent.change(input, { target: { value: "How do CRDTs merge?" } });
    const send = screen.getByRole("button", { name: "Answer" }) as HTMLButtonElement;
    await waitFor(() => expect(send.disabled).toBe(false)); // providers loaded
    fireEvent.click(send);

    expect((await screen.findAllByText(/CRDTs merge deterministically/)).length).toBeGreaterThan(0);
    expect(screen.getByText("CRDT basics")).toBeTruthy(); // evidence
    expect(screen.getByText(/Based on 1 sources/i)).toBeTruthy();
  });

  it("shows the insufficient-evidence notice when there are no citations", async () => {
    stub([enabledProvider], { answer: "n/a", citations: [], confidence: "low" });
    renderAsk();
    const input = await screen.findByPlaceholderText(/ask your saved sources/i);
    fireEvent.change(input, { target: { value: "obscure?" } });
    const send = screen.getByRole("button", { name: "Answer" }) as HTMLButtonElement;
    await waitFor(() => expect(send.disabled).toBe(false));
    fireEvent.click(send);

    await waitFor(() => expect(screen.getByText(/don't contain enough information/i)).toBeTruthy());
  });

  it("disables asking and shows a hint when no provider is enabled", async () => {
    stub([], answer);
    renderAsk();
    expect(await screen.findByText(/Enable an AI provider/i)).toBeTruthy();
    const send = screen.getByRole("button", { name: "Answer" }) as HTMLButtonElement;
    expect(send.disabled).toBe(true);
  });
});
