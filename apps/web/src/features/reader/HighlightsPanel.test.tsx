// @vitest-environment jsdom
import type { Annotation } from "@sourdex/core";
import { afterEach, describe, expect, it, vi } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import "@/lib/i18n";
import { HighlightsPanel } from "./HighlightsPanel";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

function json(value: unknown) {
  return Promise.resolve(
    new Response(JSON.stringify(value), {
      status: 200,
      headers: { "content-type": "application/json" },
    }),
  );
}

const annotation: Annotation = {
  id: "anno_1",
  itemId: "item_1",
  chunkId: null,
  selectedText: "local-first software",
  note: "the core idea",
  color: "amber",
  createdAt: "x",
  updatedAt: "x",
};

function renderPanel(annotations: Annotation[]) {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => json({ annotations })),
  );
  return render(
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
    >
      <HighlightsPanel itemId="item_1" />
    </QueryClientProvider>,
  );
}

describe("HighlightsPanel", () => {
  it("renders highlights with their quote and note", async () => {
    renderPanel([annotation]);
    expect(await screen.findByText(/local-first software/)).toBeTruthy();
    expect(screen.getByText("the core idea")).toBeTruthy();
    expect(screen.getByText("Highlights & Notes")).toBeTruthy();
  });

  it("renders nothing when there are no annotations", async () => {
    const { container } = renderPanel([]);
    await waitFor(() =>
      expect((globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls.length).toBeGreaterThan(0),
    );
    expect(container.querySelector("section")).toBeNull();
  });
});
