// @vitest-environment jsdom
import type { TagWithCount } from "@sourdex/core";
import { afterEach, describe, expect, it, vi } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import "@/lib/i18n";
import { TagsPage } from "./TagsPage";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

function json(body: unknown, status = 200) {
  return Promise.resolve(
    new Response(status === 204 ? null : JSON.stringify(body), {
      status,
      headers: { "content-type": "application/json" },
    }),
  );
}

const TAGS: TagWithCount[] = [
  {
    id: "tag_1",
    name: "local-first",
    normalizedName: "local-first",
    type: "manual",
    createdAt: "2026-06-20T00:00:00.000Z",
    count: 12,
  },
  {
    id: "tag_2",
    name: "sqlite",
    normalizedName: "sqlite",
    type: "ai",
    createdAt: "2026-06-21T00:00:00.000Z",
    count: 5,
  },
];

function stub() {
  const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
    const u = String(url);
    if (u.endsWith("/api/tags") && (!init || init.method === undefined || init.method === "GET")) {
      return json({ tags: TAGS });
    }
    if (init?.method === "PATCH") return json({ tag: TAGS[0], merged: false });
    if (init?.method === "DELETE") return json(null, 204);
    return json({});
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

function renderPage() {
  return render(
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
    >
      <MemoryRouter>
        <TagsPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("TagsPage", () => {
  it("renders the tag cloud and list with counts and an AI badge", async () => {
    stub();
    renderPage();
    // The tag appears in both the cloud and the list.
    await waitFor(() => expect(screen.getAllByText("local-first").length).toBeGreaterThan(0));
    expect(screen.getAllByText("12").length).toBeGreaterThan(0);
    expect(screen.getAllByText("AI").length).toBeGreaterThan(0);
  });

  it("renames a tag via inline edit (PATCH)", async () => {
    const fetchMock = stub();
    renderPage();
    await waitFor(() => expect(screen.getAllByLabelText("Rename").length).toBe(2));

    fireEvent.click(screen.getAllByLabelText("Rename")[0]!);
    const input = (await screen.findByDisplayValue("local-first")) as HTMLInputElement;
    fireEvent.change(input, { target: { value: "lofi" } });
    fireEvent.submit(input.closest("form")!);

    await waitFor(() =>
      expect(
        fetchMock.mock.calls.some(
          ([, init]) => (init as RequestInit | undefined)?.method === "PATCH",
        ),
      ).toBe(true),
    );
  });

  it("deletes a tag after confirmation (DELETE)", async () => {
    const fetchMock = stub();
    renderPage();
    await waitFor(() => expect(screen.getAllByLabelText("Delete").length).toBe(2));

    fireEvent.click(screen.getAllByLabelText("Delete")[0]!);
    // ConfirmDialog appears; click its confirm button.
    const confirm = await screen.findByText("Delete this tag?");
    expect(confirm).toBeTruthy();
    fireEvent.click(screen.getAllByRole("button", { name: "Delete" }).slice(-1)[0]!);

    await waitFor(() =>
      expect(
        fetchMock.mock.calls.some(
          ([, init]) => (init as RequestInit | undefined)?.method === "DELETE",
        ),
      ).toBe(true),
    );
  });
});
