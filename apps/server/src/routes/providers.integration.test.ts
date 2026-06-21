import type { InjectOptions } from "fastify";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createTestServer, type TestServer } from "../testing.js";

let server: TestServer;

function auth(opts: InjectOptions) {
  return server.app.inject({ ...opts, headers: { ...server.authHeaders, ...opts.headers } });
}

interface ProviderView {
  id: string;
  name: string;
  type: string;
  enabled: boolean;
  hasApiKey: boolean;
  baseUrl: string | null;
}

beforeEach(async () => {
  server = await createTestServer();
});

afterEach(async () => {
  await server.cleanup();
});

describe("AI provider settings API (TASK-057)", () => {
  it("runs the full CRUD lifecycle and never returns the API key", async () => {
    const created = await auth({
      method: "POST",
      url: "/api/settings/providers",
      payload: {
        name: "OpenAI",
        type: "openai-compatible",
        baseUrl: "https://api.openai.com/v1",
        chatModel: "gpt-4o-mini",
        apiKey: "sk-INTEGRATION-SECRET",
      },
    });
    expect(created.statusCode).toBe(201);
    expect(created.body).not.toContain("sk-INTEGRATION-SECRET");
    const view = created.json() as ProviderView;
    expect(view.hasApiKey).toBe(true);
    expect(view.enabled).toBe(false);
    expect(view).not.toHaveProperty("apiKey");

    const list = await auth({ method: "GET", url: "/api/settings/providers" });
    expect((list.json() as ProviderView[]).map((p) => p.id)).toContain(view.id);
    expect(list.body).not.toContain("sk-INTEGRATION-SECRET");

    const patched = await auth({
      method: "PATCH",
      url: `/api/settings/providers/${view.id}`,
      payload: { enabled: true },
    });
    expect((patched.json() as ProviderView).enabled).toBe(true);
    expect((patched.json() as ProviderView).hasApiKey).toBe(true);

    const removed = await auth({ method: "DELETE", url: `/api/settings/providers/${view.id}` });
    expect(removed.statusCode).toBe(200);
    expect(
      (await auth({ method: "GET", url: `/api/settings/providers/${view.id}` })).statusCode,
    ).toBe(404);
  });

  it("clears the stored key when apiKey is null", async () => {
    const created = await auth({
      method: "POST",
      url: "/api/settings/providers",
      payload: { name: "X", type: "openai-compatible", baseUrl: "https://x.test", apiKey: "k" },
    });
    const { id } = created.json() as ProviderView;
    const cleared = await auth({
      method: "PATCH",
      url: `/api/settings/providers/${id}`,
      payload: { apiKey: null },
    });
    expect((cleared.json() as ProviderView).hasApiKey).toBe(false);
  });

  it("rejects invalid input with 400", async () => {
    const badType = await auth({
      method: "POST",
      url: "/api/settings/providers",
      payload: { name: "X", type: "not-a-provider" },
    });
    expect(badType.statusCode).toBe(400);

    const badUrl = await auth({
      method: "POST",
      url: "/api/settings/providers",
      payload: { name: "X", type: "openai-compatible", baseUrl: "not a url" },
    });
    expect(badUrl.statusCode).toBe(400);

    const noName = await auth({
      method: "POST",
      url: "/api/settings/providers",
      payload: { type: "ollama" },
    });
    expect(noName.statusCode).toBe(400);
  });

  it("requires authentication", async () => {
    const res = await server.app.inject({ method: "GET", url: "/api/settings/providers" });
    expect(res.statusCode).toBe(401);
  });

  it("returns 404 when testing a missing provider", async () => {
    const res = await auth({ method: "POST", url: "/api/settings/providers/pc_missing/test" });
    expect(res.statusCode).toBe(404);
  });
});
