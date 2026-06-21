// @vitest-environment jsdom
import { HIGHLIGHT_CLOSE, HIGHLIGHT_OPEN } from "@sourdex/core";
import { afterEach, describe, expect, it, vi } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { cleanup, render, screen } from "@testing-library/react";
import "@/lib/i18n";
import { SearchPage } from "./SearchPage";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

const hit = {
  itemId: "item_1",
  title: "SQLite FTS5 guide",
  url: "https://example.com",
  domain: "example.com",
  type: "webpage",
  savedAt: new Date().toISOString(),
  snippet: `full text ${HIGHLIGHT_OPEN}dolphinmarker${HIGHLIGHT_CLOSE} inside`,
  score: 0.91,
  matchedFields: ["content"],
};

function renderSearch() {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () =>
      Promise.resolve(
        new Response(JSON.stringify({ results: [hit] }), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
      ),
    ),
  );
  return render(
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
    >
      <MemoryRouter initialEntries={["/search?q=dolphinmarker"]}>
        <SearchPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("SearchPage", () => {
  it("renders search results for the query in the URL", async () => {
    renderSearch();
    expect(await screen.findByText("SQLite FTS5 guide")).toBeTruthy();
    expect(screen.getByText("example.com")).toBeTruthy();
    expect(screen.getByText(/91%/)).toBeTruthy();
  });

  it("wraps highlighted snippet terms in <mark>", async () => {
    renderSearch();
    const marked = await screen.findByText("dolphinmarker");
    expect(marked.closest("mark")).not.toBeNull();
  });
});
