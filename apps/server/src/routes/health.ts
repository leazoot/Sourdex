import type { FastifyInstance } from "fastify";
import type { ServerConfig } from "../config.js";

/** Server version reported by /api/status (PRD §5.1.8 local service status). */
export const SERVER_VERSION = "0.0.0";

/** Health and status endpoints. */
export function registerHealthRoutes(app: FastifyInstance, config: ServerConfig): void {
  app.get("/api/health", async () => ({ status: "ok" as const }));

  app.get("/api/status", async () => ({
    status: "ok" as const,
    version: SERVER_VERSION,
    dataDir: config.dataDir,
    host: config.host,
    port: config.port,
  }));
}
