// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import "@/lib/i18n";
import { ExportPage } from "./ExportPage";

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

function stub() {
  const fetchMock = vi.fn(async (url: string, _init?: RequestInit) => {
    const u = String(url);
    if (u.includes("/api/status")) return json({ dataDir: "/home/u/.sourdex" });
    if (u.endsWith("/api/tags")) return json({ tags: [] });
    if (u.includes("/api/export/markdown")) {
      return json({
        exportId: "export_1",
        path: "files/exports/export_1/sourdex-export.csv",
        count: 3,
        failed: [],
      });
    }
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
        <ExportPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("ExportPage", () => {
  it("renders the format cards, scope options and destination", async () => {
    stub();
    renderPage();
    expect(screen.getByText("Markdown")).toBeTruthy();
    expect(screen.getByText("JSON")).toBeTruthy();
    expect(screen.getByText("CSV")).toBeTruthy();
    expect(screen.getByText("Entire library")).toBeTruthy();
    await waitFor(() => expect(screen.getByText(/\.sourdex\/files\/exports/)).toBeTruthy());
  });

  it("runs an export with the chosen format and shows the result", async () => {
    const fetchMock = stub();
    renderPage();

    fireEvent.click(screen.getByText("CSV"));
    fireEvent.click(screen.getByRole("button", { name: "Export" }));

    await waitFor(() => expect(screen.getByText(/Exported 3 sources/)).toBeTruthy());

    const call = fetchMock.mock.calls.find(([u]) => String(u).includes("/api/export/markdown"));
    expect(call).toBeTruthy();
    const body = JSON.parse((call![1] as RequestInit).body as string) as {
      format: string;
      scope: { type: string };
    };
    expect(body.format).toBe("csv");
    expect(body.scope.type).toBe("all");
  });
});
