import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

/**
 * Shared configuration for the v0.1 end-to-end suite (TASK-048).
 *
 * A fixed Bearer token is written into a throwaway data directory so the real server boots
 * with a known token and the web app can authenticate via VITE_SOURDEX_API_TOKEN — no
 * interactive pairing is needed in CI. This token only ever guards a temporary loopback
 * server backed by a throwaway data dir; it never touches real user data.
 */
const SERVER_PORT = 8799;
const WEB_PORT = 5180;
const TOKEN = "e2e-fixed-token-not-for-production";
const DATA_DIR = join(tmpdir(), "sourdex-e2e");

export const E2E = {
  serverPort: SERVER_PORT,
  webPort: WEB_PORT,
  token: TOKEN,
  dataDir: DATA_DIR,
  serverUrl: `http://127.0.0.1:${SERVER_PORT}`,
  webUrl: `http://127.0.0.1:${WEB_PORT}`,
};

/**
 * Reset the throwaway data dir and seed the auth token file the server reads on boot
 * (see `loadOrCreateToken`). Run once when the Playwright config module loads, before the
 * server web-server command starts, so the server picks up the known token.
 */
export function prepareE2eDataDir(): void {
  rmSync(DATA_DIR, { recursive: true, force: true });
  mkdirSync(join(DATA_DIR, "config"), { recursive: true });
  writeFileSync(
    join(DATA_DIR, "config", "auth.json"),
    `${JSON.stringify({ token: TOKEN }, null, 2)}\n`,
  );
}
