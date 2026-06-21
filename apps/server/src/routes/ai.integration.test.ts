import type { InjectOptions } from "fastify";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { SummaryOutput } from "@sourdex/core";
import { createTestServer, type TestServer } from "../testing.js";

let server: TestServer;

function auth(opts: InjectOptions) {
  return server.app.inject({ ...opts, headers: { ...server.authHeaders, ...opts.headers } });
}

async function saveAndExtract(): Promise<string> {
  const res = await auth({
    method: "POST",
    url: "/api/captures/webpage",
    payload: {
      url: "https://example.com/ai",
      title: "AI summary target",
      html: "<html><body><article><h1>AI summary target</h1><p>A page worth summarizing in detail.</p></article></body></html>",
    },
  });
  const { itemId } = res.json() as { itemId: string };
  await server.container.worker.processOnce();
  return itemId;
}

async function enableProvider(): Promise<void> {
  await auth({
    method: "POST",
    url: "/api/settings/providers",
    payload: {
      name: "P",
      type: "openai-compatible",
      baseUrl: "https://api.example.com/v1",
      enabled: true,
      apiKey: "sk-x",
    },
  });
}

beforeEach(async () => {
  server = await createTestServer();
});

afterEach(async () => {
  await server.cleanup();
});

describe("POST /api/ai/summarize/:itemId (TASK-062)", () => {
  it("404s for a missing item", async () => {
    const res = await auth({ method: "POST", url: "/api/ai/summarize/item_missing" });
    expect(res.statusCode).toBe(404);
  });

  it("409s when no AI provider is enabled", async () => {
    const itemId = await saveAndExtract();
    const res = await auth({ method: "POST", url: `/api/ai/summarize/${itemId}` });
    expect(res.statusCode).toBe(409);
    expect(res.json()).toMatchObject({ error: "NO_AI_PROVIDER" });
  });

  it("enqueues a generate_summary job and marks the item pending", async () => {
    const itemId = await saveAndExtract();
    await enableProvider();

    const res = await auth({ method: "POST", url: `/api/ai/summarize/${itemId}` });
    expect(res.statusCode).toBe(202);
    const { jobId, status } = res.json() as { jobId: string; status: string };
    expect(status).toBe("pending");
    expect(server.container.jobRepo.findById(jobId)?.type).toBe("generate_summary");
    expect(server.container.itemRepo.findById(itemId)?.aiStatus).toBe("pending");
  });
});

describe("POST /api/ai/embed/:itemId (STAGE-15)", () => {
  it("404s for a missing item", async () => {
    const res = await auth({ method: "POST", url: "/api/ai/embed/item_missing" });
    expect(res.statusCode).toBe(404);
  });

  it("409s when no enabled provider has an embedding model", async () => {
    const itemId = await saveAndExtract();
    await enableProvider(); // no embeddingModel configured
    const res = await auth({ method: "POST", url: `/api/ai/embed/${itemId}` });
    expect(res.statusCode).toBe(409);
    expect(res.json()).toMatchObject({ error: "NO_AI_PROVIDER" });
  });

  it("enqueues a generate_embedding job when an embedding provider is enabled", async () => {
    const itemId = await saveAndExtract();
    await auth({
      method: "POST",
      url: "/api/settings/providers",
      payload: {
        name: "Emb",
        type: "openai-compatible",
        baseUrl: "https://api.example.com/v1",
        embeddingModel: "text-embedding-3-small",
        enabled: true,
        apiKey: "sk-x",
      },
    });

    const res = await auth({ method: "POST", url: `/api/ai/embed/${itemId}` });
    expect(res.statusCode).toBe(202);
    const { jobId, status } = res.json() as { jobId: string; status: string };
    expect(status).toBe("pending");
    expect(server.container.jobRepo.findById(jobId)?.type).toBe("generate_embedding");
  });
});

describe("POST /api/ask (STAGE-17)", () => {
  it("400s when the question is missing", async () => {
    const res = await auth({ method: "POST", url: "/api/ask", payload: {} });
    expect(res.statusCode).toBe(400);
  });

  it("409s when no AI provider is enabled", async () => {
    const res = await auth({ method: "POST", url: "/api/ask", payload: { question: "hi?" } });
    expect(res.statusCode).toBe(409);
    expect(res.json()).toMatchObject({ error: "NO_AI_PROVIDER" });
  });

  it("answers with insufficient evidence when the library is empty (no fabrication)", async () => {
    await enableProvider();
    const res = await auth({ method: "POST", url: "/api/ask", payload: { question: "anything?" } });
    expect(res.statusCode).toBe(200);
    const body = res.json() as { answer: string; citations: unknown[]; confidence: string };
    expect(body.citations).toEqual([]);
    expect(body.confidence).toBe("low");
  });
});

describe("GET /api/items/:id summary exposure (TASK-062)", () => {
  it("returns the latest structured summary when one exists", async () => {
    const itemId = await saveAndExtract();
    const summary: SummaryOutput = {
      oneSentence: "One line.",
      summary: "Full summary.",
      keyPoints: ["k1"],
      usefulFor: [],
      riskNotes: [],
      suggestedTags: ["tag"],
    };
    server.container.aiOutputRepo.create({
      itemId,
      type: "summary",
      provider: "openai-compatible",
      model: "m",
      inputHash: "h",
      output: JSON.stringify(summary),
    });

    const res = await auth({ method: "GET", url: `/api/items/${itemId}` });
    expect(res.statusCode).toBe(200);
    expect((res.json() as { summary: SummaryOutput | null }).summary).toEqual(summary);
  });

  it("returns null summary when none generated", async () => {
    const itemId = await saveAndExtract();
    const res = await auth({ method: "GET", url: `/api/items/${itemId}` });
    expect((res.json() as { summary: SummaryOutput | null }).summary).toBeNull();
  });
});
