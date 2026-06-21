import type { FastifyInstance, FastifyRequest } from "fastify";
import { z } from "zod";
import type { Container } from "../container.js";

const completeSchema = z.object({ code: z.string().min(1) });

/** Only loopback callers may run the pairing flow (defense in depth atop 127.0.0.1 bind). */
function isLoopback(request: FastifyRequest): boolean {
  const ip = request.ip;
  return ip === "127.0.0.1" || ip === "::1" || ip === "::ffff:127.0.0.1";
}

/**
 * Pairing API (OQ-A1, 方案B). Both endpoints are unauthenticated (the extension has no
 * token yet) but loopback-only. `initiate` prints a short single-use code to the server
 * console; `complete` exchanges it for the Bearer token.
 */
export function registerPairRoutes(app: FastifyInstance, container: Container): void {
  app.post("/api/pair/initiate", async (request, reply) => {
    if (!isLoopback(request)) {
      reply.code(403).send({ error: "FORBIDDEN", message: "Pairing is only available locally" });
      return;
    }
    const { code, expiresAt } = container.auth.initiatePairing();
    // Intentional console output: the user must read this code to pair (not a content log).
    app.log.info(`Sourdex pairing code: ${code} (valid until ${expiresAt})`);
    console.info(
      `\n🔑 Sourdex pairing code: ${code}\n   Enter it in the extension within 5 minutes.\n`,
    );
    return { expiresAt, codeLength: code.length };
  });

  app.post("/api/pair/complete", async (request, reply) => {
    if (!isLoopback(request)) {
      reply.code(403).send({ error: "FORBIDDEN", message: "Pairing is only available locally" });
      return;
    }
    const { code } = completeSchema.parse(request.body);
    const token = container.auth.completePairing(code);
    if (!token) {
      reply.code(401).send({ error: "PAIRING_FAILED", message: "Invalid or expired pairing code" });
      return;
    }
    return { token };
  });
}
