// @vitest-environment jsdom
import type { Item } from "@sourdex/core";
import { afterEach, describe, expect, it, vi } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import "@/lib/i18n";
import { ReaderPage } from "./ReaderPage";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

const item: Item = {
  id: "item_1",
  type: "webpage",
  status: "read",
  title: "Readable Article",
  url: "https://example.com",
  canonicalUrl: null,
  domain: "example.com",
  author: "Jane",
  publishedAt: null,
  savedAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  summary: null,
  oneSentence: null,
  thumbnailPath: null,
  sourceHash: null,
  wordCount: 1200,
  readingTime: 6,
  aiStatus: "none",
};

function json(value: unknown) {
  return Promise.resolve(
    new Response(JSON.stringify(value), {
      status: 200,
      headers: { "content-type": "application/json" },
    }),
  );
}

describe("ReaderPage", () => {
  it("renders the title and the extracted readable content", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn((url: string, init?: RequestInit) => {
        const u = String(url);
        if (init?.method === "PATCH") return json(item);
        if (u.includes("/content")) {
          return json({ markdown: "# x", readableHtml: "<p>Hello body text</p>", plainText: "x" });
        }
        return json({ item, capture: null, tags: [] });
      }),
    );

    render(
      <QueryClientProvider
        client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
      >
        <MemoryRouter initialEntries={["/reader/item_1"]}>
          <Routes>
            <Route path="reader/:id" element={<ReaderPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    );

    expect(await screen.findByText("Readable Article")).toBeTruthy();
    expect(await screen.findByText("Hello body text")).toBeTruthy();
  });

  it("exports the item and shows the produced path (TASK-046)", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn((url: string, init?: RequestInit) => {
        const u = String(url);
        if (u.includes("/api/export/markdown")) {
          return json({
            exportId: "export_1",
            path: "files/exports/export_1/Readable Article.md",
            count: 1,
            failed: [],
          });
        }
        if (init?.method === "PATCH") return json(item);
        if (u.includes("/content"))
          return json({ markdown: "# x", readableHtml: null, plainText: "x" });
        return json({ item, capture: null, tags: [] });
      }),
    );

    render(
      <QueryClientProvider
        client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
      >
        <MemoryRouter initialEntries={["/reader/item_1"]}>
          <Routes>
            <Route path="reader/:id" element={<ReaderPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    );

    fireEvent.click(await screen.findByText("Export"));
    expect(await screen.findByText(/files\/exports\/export_1\/Readable Article\.md/)).toBeTruthy();
  });
});
