import type { FastifyInstance } from "fastify";
import { z } from "zod";
import type { Container } from "../container.js";

const captureWebpageSchema = z.object({
  url: z.string().url(),
  title: z.string(),
  html: z.string(),
  selectedText: z.string().optional(),
  faviconUrl: z.string().optional(),
  capturedAt: z.string().optional(),
  forceNew: z.boolean().optional(),
});

// Full-page HTML can be several MB (forums, SPAs); allow generous headroom on this route
// only, while the global default stays at 1 MB. Larger pages return a readable 413.
const CAPTURE_BODY_LIMIT = 32 * 1024 * 1024;

/** Capture API (PRD §13.1). */
export function registerCaptureRoutes(app: FastifyInstance, container: Container): void {
  app.post("/api/captures/webpage", { bodyLimit: CAPTURE_BODY_LIMIT }, async (request, reply) => {
    const body = captureWebpageSchema.parse(request.body);
    const result = await container.captureService.captureWebpage(body);
    reply.code(result.status === "saved" ? 201 : 200);
    return result;
  });
}
