// @vitest-environment jsdom
import type { Item } from "@sourdex/core";
import { afterEach, describe, expect, it, vi } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { cleanup, render, screen } from "@testing-library/react";
import "@/lib/i18n";
import { InboxPage } from "./InboxPage";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

const item: Item = {
  id: "item_42",
  type: "webpage",
  status: "inbox",
  title: "An Inbox Item",
  url: "https://example.com",
  canonicalUrl: null,
  domain: "example.com",
  author: null,
  publishedAt: null,
  savedAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  summary: null,
  oneSentence: null,
  thumbnailPath: null,
  sourceHash: null,
  wordCount: 0,
  readingTime: 0,
  aiStatus: "none",
};

function renderInbox() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <InboxPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("InboxPage", () => {
  it("loads and renders inbox items from the API", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        Promise.resolve(
          new Response(JSON.stringify({ items: [item], page: 1, pageSize: 20, total: 1 }), {
            status: 200,
            headers: { "content-type": "application/json" },
          }),
        ),
      ),
    );
    renderInbox();
    expect(await screen.findByText("An Inbox Item")).toBeTruthy();
  });

  it("shows the empty state when there are no items", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        Promise.resolve(
          new Response(JSON.stringify({ items: [], page: 1, pageSize: 20, total: 0 }), {
            status: 200,
            headers: { "content-type": "application/json" },
          }),
        ),
      ),
    );
    renderInbox();
    expect(await screen.findByText(/Inbox is empty/i)).toBeTruthy();
  });
});
