import cors from "@fastify/cors";
import { AIProviderError, isSourdexError, NotFoundError, ValidationError } from "@sourdex/core";
import Fastify, { type FastifyInstance } from "fastify";
import { ZodError } from "zod";
import type { ServerConfig } from "./config.js";
import type { Container } from "./container.js";
import { registerCaptureRoutes } from "./routes/captures.js";
import { registerHealthRoutes } from "./routes/health.js";
import { registerItemRoutes } from "./routes/items.js";
import { registerPairRoutes } from "./routes/pair.js";
import { registerSearchRoutes } from "./routes/search.js";
import { registerExportRoutes } from "./routes/export.js";
import { registerProviderRoutes } from "./routes/providers.js";
import { registerAiRoutes } from "./routes/ai.js";
import { registerAnnotationRoutes } from "./routes/annotations.js";

/** Endpoints reachable without a paired token: liveness + the pairing handshake itself. */
const PUBLIC_PATHS = new Set(["/api/health", "/api/pair/initiate", "/api/pair/complete"]);

function isAllowedOrigin(origin: string, config: ServerConfig): boolean {
  return (
    origin.startsWith("chrome-extension://") ||
    origin.startsWith("http://localhost") ||
    origin.startsWith("http://127.0.0.1") ||
    config.corsOrigins.includes(origin)
  );
}

/**
 * Build the Fastify app: CORS (extension + local web UI only, PRD §17.3), routes,
 * and an error handler that maps domain errors to status codes without leaking
 * internals (PRD §11.5). Plugin-level token auth (OQ-A1) is added in STAGE-06.
 */
export async function buildApp(
  container: Container,
  config: ServerConfig,
  options: { logger?: boolean } = {},
): Promise<FastifyInstance> {
  // Keep Fastify's modest 1 MB default body limit globally; only the capture route (which
  // carries full-page HTML) raises it, per-route, so other endpoints stay tightly bounded.
  const app = Fastify({ logger: options.logger ?? false });

  await app.register(cors, {
    origin: (origin, cb) => {
      // No Origin header (same-origin / curl / native) is allowed.
      if (!origin) {
        cb(null, true);
        return;
      }
      cb(null, isAllowedOrigin(origin, config));
    },
  });

  // Require the paired Bearer token on every endpoint except the public allowlist
  // (OQ-A1). Returns 401 without leaking whether a token exists.
  app.addHook("onRequest", async (request, reply) => {
    const path = request.url.split("?")[0];
    if (path && PUBLIC_PATHS.has(path)) return;
    if (container.auth.verifyAuthHeader(request.headers.authorization)) return;
    reply.code(401).send({ error: "UNAUTHORIZED", message: "Missing or invalid token" });
  });

  app.setErrorHandler((error, request, reply) => {
    if (error instanceof ZodError) {
      reply
        .code(400)
        .send({ error: "VALIDATION_ERROR", message: "Invalid request", details: error.issues });
      return;
    }
    if (error instanceof ValidationError) {
      reply.code(400).send({ error: error.code, message: error.message });
      return;
    }
    if (error instanceof NotFoundError) {
      reply.code(404).send({ error: error.code, message: error.message });
      return;
    }
    // Upstream AI provider failure: the message is safe (no key/body) and readable.
    if (error instanceof AIProviderError) {
      reply.code(502).send({ error: error.code, message: error.message });
      return;
    }
    // Oversized capture payload: return a readable 413 instead of a generic 500.
    if ((error as { code?: unknown }).code === "FST_ERR_CTP_BODY_TOO_LARGE") {
      reply.code(413).send({ error: "BODY_TOO_LARGE", message: "This page is too large to save." });
      return;
    }
    // Anything else is internal: log it, but never leak details to the client.
    request.log.error(error);
    const code = isSourdexError(error) ? error.code : "INTERNAL_ERROR";
    reply.code(500).send({ error: code, message: "Internal server error" });
  });

  registerHealthRoutes(app, config);
  registerPairRoutes(app, container);
  registerCaptureRoutes(app, container);
  registerItemRoutes(app, container);
  registerSearchRoutes(app, container);
  registerExportRoutes(app, container);
  registerProviderRoutes(app, container);
  registerAiRoutes(app, container);
  registerAnnotationRoutes(app, container);

  return app;
}
