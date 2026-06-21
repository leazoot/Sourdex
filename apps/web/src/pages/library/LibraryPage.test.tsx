// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { cleanup, render, screen } from "@testing-library/react";
import "@/lib/i18n";
import { LibraryPage } from "./LibraryPage";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("LibraryPage", () => {
  it("renders the title and status tabs", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        Promise.resolve(
          new Response(JSON.stringify({ items: [], page: 1, pageSize: 100, total: 0 }), {
            status: 200,
            headers: { "content-type": "application/json" },
          }),
        ),
      ),
    );
    render(
      <QueryClientProvider
        client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
      >
        <MemoryRouter>
          <LibraryPage />
        </MemoryRouter>
      </QueryClientProvider>,
    );
    expect(screen.getByText("Library")).toBeTruthy();
    expect(screen.getByText("All")).toBeTruthy();
    expect(screen.getByText("Unread")).toBeTruthy();
    expect(screen.getByText("Archived")).toBeTruthy();
  });
});
