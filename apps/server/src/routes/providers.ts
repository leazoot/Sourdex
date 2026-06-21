import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { NotFoundError } from "@sourdex/core";
import type { Container } from "../container.js";

const PROVIDER_TYPES = ["openai-compatible", "ollama", "anthropic", "gemini", "lm-studio"] as const;

const idParamSchema = z.object({ id: z.string().min(1) });

const createSchema = z.object({
  name: z.string().min(1).max(100),
  type: z.enum(PROVIDER_TYPES),
  baseUrl: z.string().url().nullable().optional(),
  chatModel: z.string().min(1).nullable().optional(),
  embeddingModel: z.string().min(1).nullable().optional(),
  enabled: z.boolean().optional(),
  apiKey: z.string().min(1).optional(),
});

const updateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  type: z.enum(PROVIDER_TYPES).optional(),
  baseUrl: z.string().url().nullable().optional(),
  chatModel: z.string().min(1).nullable().optional(),
  embeddingModel: z.string().min(1).nullable().optional(),
  enabled: z.boolean().optional(),
  // `null` clears the stored key, a string replaces it, omitted leaves it unchanged.
  apiKey: z.string().min(1).nullable().optional(),
});

/**
 * AI provider settings API (PRD §13.4 infra, §17.2). Responses carry only non-secret
 * config plus `hasApiKey`; the API key is never returned. PATCH is used for partial
 * updates (house style, see items route). All inputs are Zod-validated.
 */
export function registerProviderRoutes(app: FastifyInstance, container: Container): void {
  const service = container.providerConfigService;

  app.get("/api/settings/providers", async () => {
    return service.list();
  });

  app.get("/api/settings/providers/:id", async (request) => {
    const { id } = idParamSchema.parse(request.params);
    const view = await service.get(id);
    if (!view) throw new NotFoundError(`Provider config ${id} not found`);
    return view;
  });

  app.post("/api/settings/providers", async (request, reply) => {
    const body = createSchema.parse(request.body);
    const view = await service.create(body);
    reply.code(201);
    return view;
  });

  app.patch("/api/settings/providers/:id", async (request) => {
    const { id } = idParamSchema.parse(request.params);
    const body = updateSchema.parse(request.body);
    const view = await service.update(id, body);
    if (!view) throw new NotFoundError(`Provider config ${id} not found`);
    return view;
  });

  app.delete("/api/settings/providers/:id", async (request) => {
    const { id } = idParamSchema.parse(request.params);
    const deleted = await service.remove(id);
    if (!deleted) throw new NotFoundError(`Provider config ${id} not found`);
    return { id, deleted: true as const };
  });

  app.post("/api/settings/providers/:id/test", async (request) => {
    const { id } = idParamSchema.parse(request.params);
    return service.testConnection(id);
  });
}
