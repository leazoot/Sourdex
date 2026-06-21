import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { FastifyInstance } from "fastify";
import { buildApp } from "./app.js";
import type { ServerConfig } from "./config.js";
import { createContainer, type Container } from "./container.js";

export interface TestServer {
  app: FastifyInstance;
  container: Container;
  config: ServerConfig;
  /** A valid paired token (obtained via the real pairing flow). */
  token: string;
  /** Authorization header for authenticated `app.inject` calls. */
  authHeaders: { authorization: string };
  /** Close the app + DB and remove the temp data directory. */
  cleanup: () => Promise<void>;
}

/**
 * Build a fully-wired server backed by an in-memory database and a temp data dir,
 * for integration tests via `app.inject(...)`. The job worker is not started.
 */
export async function createTestServer(): Promise<TestServer> {
  const dataDir = mkdtempSync(join(tmpdir(), "sourdex-test-"));
  const config: ServerConfig = {
    host: "127.0.0.1",
    port: 0,
    dataDir,
    dbPath: ":memory:",
    tokenPath: join(dataDir, "config", "auth.json"),
    secretsPath: join(dataDir, "config", "secrets.enc"),
    corsOrigins: [],
  };
  const container = createContainer(config);
  const app = await buildApp(container, config, { logger: false });
  await app.ready();

  // Pair through the real flow so tests exercise the genuine token, not a private field.
  const { code } = container.auth.initiatePairing();
  const token = container.auth.completePairing(code);
  if (!token) throw new Error("test pairing failed");

  const cleanup = async (): Promise<void> => {
    await app.close();
    container.close();
    rmSync(dataDir, { recursive: true, force: true });
  };

  return {
    app,
    container,
    config,
    token,
    authHeaders: { authorization: `Bearer ${token}` },
    cleanup,
  };
}
