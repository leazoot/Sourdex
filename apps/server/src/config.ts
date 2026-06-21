import { homedir } from "node:os";
import { join } from "node:path";

/** Resolved server configuration. */
export interface ServerConfig {
  host: string;
  port: number;
  dataDir: string;
  dbPath: string;
  /** Path to the local-service token file (OQ-A1, plugin pairing). */
  tokenPath: string;
  /** Extra allowed CORS origins (in addition to localhost + chrome-extension). */
  corsOrigins: string[];
}

/** Default per-OS data directory (PRD §16.1). */
export function defaultDataDir(
  env: NodeJS.ProcessEnv = process.env,
  platform = process.platform,
): string {
  const home = homedir();
  if (platform === "darwin") return join(home, "Library", "Application Support", "Sourdex");
  if (platform === "win32") return join(env.APPDATA ?? join(home, "AppData", "Roaming"), "Sourdex");
  return join(env.XDG_DATA_HOME ?? join(home, ".local", "share"), "sourdex");
}

/**
 * Load server config from the environment. Binds to 127.0.0.1 by default and never
 * to 0.0.0.0 implicitly (PRD §17.3).
 */
export function loadConfig(env: NodeJS.ProcessEnv = process.env): ServerConfig {
  const dataDir = env.SOURDEX_DATA_DIR ?? defaultDataDir(env);
  return {
    host: env.SOURDEX_HOST ?? "127.0.0.1",
    port: env.SOURDEX_PORT ? Number(env.SOURDEX_PORT) : 8787,
    dataDir,
    dbPath: join(dataDir, "sourdex.db"),
    tokenPath: join(dataDir, "config", "auth.json"),
    corsOrigins: (env.SOURDEX_CORS_ORIGINS ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
  };
}
