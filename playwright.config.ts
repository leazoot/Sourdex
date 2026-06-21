import { defineConfig } from "@playwright/test";
import { E2E, prepareE2eDataDir } from "./tests/e2e/test-env";

// Seed a throwaway data dir + known token before the server boots (TASK-048). The v0.1
// critical flow (save → inbox → search → reader → export) lives under tests/e2e. The web app
// reads the token from VITE_SOURDEX_API_TOKEN so the run needs no interactive pairing.
prepareE2eDataDir();

export default defineConfig({
  testDir: "./tests/e2e",
  // One worker: the suite shares a single server + data dir, so tests run sequentially.
  workers: 1,
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: "list",
  use: { baseURL: E2E.webUrl, trace: "on-first-retry" },
  // The server runs from its built dist (run `pnpm build` first); the web app runs the Vite
  // dev server with the loopback API base + token injected via env.
  webServer: [
    {
      command: "node apps/server/dist/server.js",
      env: {
        SOURDEX_HOST: "127.0.0.1",
        SOURDEX_PORT: String(E2E.serverPort),
        SOURDEX_DATA_DIR: E2E.dataDir,
      },
      url: `${E2E.serverUrl}/api/health`,
      reuseExistingServer: false,
      stdout: "pipe",
      stderr: "pipe",
      timeout: 60_000,
    },
    {
      command: `pnpm --filter @sourdex/web exec vite --host 127.0.0.1 --port ${E2E.webPort} --strictPort`,
      env: {
        VITE_SOURDEX_API: E2E.serverUrl,
        VITE_SOURDEX_API_TOKEN: E2E.token,
      },
      url: E2E.webUrl,
      reuseExistingServer: false,
      timeout: 120_000,
    },
  ],
});
