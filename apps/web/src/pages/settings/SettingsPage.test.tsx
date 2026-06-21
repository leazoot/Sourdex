// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import "@/lib/i18n";
import { SettingsPage } from "./SettingsPage";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  document.documentElement.classList.remove("dark");
});

function renderSettings() {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () =>
      Promise.resolve(
        new Response(
          JSON.stringify({
            status: "ok",
            version: "0.0.0",
            dataDir: "/tmp/sourdex",
            host: "127.0.0.1",
            port: 8787,
          }),
          { status: 200, headers: { "content-type": "application/json" } },
        ),
      ),
    ),
  );
  return render(
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
    >
      <SettingsPage />
    </QueryClientProvider>,
  );
}

describe("SettingsPage", () => {
  it("shows appearance theme options by default", () => {
    renderSettings();
    expect(screen.getByText("Light")).toBeTruthy();
    expect(screen.getByText("Dark")).toBeTruthy();
    expect(screen.getByText("System")).toBeTruthy();
  });

  it("applies dark theme when Dark is chosen", () => {
    renderSettings();
    fireEvent.click(screen.getByText("Dark"));
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });

  it("switches to the data location section and shows the data directory", async () => {
    renderSettings();
    fireEvent.click(screen.getByText("Data location"));
    expect(await screen.findByText("/tmp/sourdex")).toBeTruthy();
  });
});
