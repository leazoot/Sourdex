import { HIGHLIGHT_OPEN } from "@sourdex/core";
import type { InjectOptions } from "fastify";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createTestServer, type TestServer } from "../testing.js";

let server: TestServer;

function auth(opts: InjectOptions) {
  return server.app.inject({ ...opts, headers: { ...server.authHeaders, ...opts.headers } });
}

/** Save a webpage and run the extraction job so its body is indexed for search. */
async function saveAndExtract(payload: {
  url: string;
  title: string;
  html: string;
  selectedText?: string;
}): Promise<string> {
  const saved = await auth({ method: "POST", url: "/api/captures/webpage", payload });
  const { itemId } = saved.json() as { itemId: string };
  await server.container.worker.processOnce();
  return itemId;
}

interface SearchHit {
  itemId: string;
  title: string;
  url: string | null;
  snippet: string;
  score: number;
  matchedFields: string[];
}

beforeEach(async () => {
  server = await createTestServer();
});

afterEach(async () => {
  await server.cleanup();
});

describe("GET /api/search (TASK-039)", () => {
  it("returns keyword hits with a highlighted snippet, score and matchedFields", async () => {
    const id = await saveAndExtract({
      url: "https://example.com/fts",
      title: "SQLite FTS5 guide",
      html: "<html><body><article><h1>SQLite FTS5 guide</h1><p>A practical guide to full text search with the dolphinmarker keyword inside.</p></article></body></html>",
    });

    const res = await auth({ method: "GET", url: "/api/search?q=dolphinmarker" });
    expect(res.statusCode).toBe(200);
    const { results } = res.json() as { results: SearchHit[] };
    expect(results).toHaveLength(1);
    expect(results[0]?.itemId).toBe(id);
    expect(results[0]?.snippet).toContain(HIGHLIGHT_OPEN);
    expect(results[0]?.snippet.toLowerCase()).toContain("dolphinmarker");
    expect(results[0]?.matchedFields).toContain("content");
    expect(results[0]?.score).toBeGreaterThan(0);
  });

  it("matches a 2-character Chinese substring inside a longer word (OQ-A7)", async () => {
    await saveAndExtract({
      url: "https://example.com/zh",
      title: "深入浅出",
      html: "<html><body><article><h1>深入浅出</h1><p>机器学习是人工智能的一个分支，研究如何让计算机从数据中自动学习并改进性能。</p></article></body></html>",
    });

    const res = await auth({ method: "GET", url: `/api/search?q=${encodeURIComponent("机器")}` });
    expect(res.statusCode).toBe(200);
    const { results } = res.json() as { results: SearchHit[] };
    expect(results).toHaveLength(1);
    // The snippet reads naturally again (no inter-character spaces) and is highlighted.
    expect(results[0]?.snippet).toContain("机器");
    expect(results[0]?.snippet).toContain(HIGHLIGHT_OPEN);
  });

  it("applies the type filter and excludes non-matching items", async () => {
    await saveAndExtract({
      url: "https://example.com/a",
      title: "Alpha report",
      html: "<html><body><article><h1>Alpha report</h1><p>This article talks about the quokkamarker topic in detail.</p></article></body></html>",
    });

    const matchType = await auth({ method: "GET", url: "/api/search?q=quokkamarker&type=webpage" });
    expect((matchType.json() as { results: SearchHit[] }).results).toHaveLength(1);

    const otherType = await auth({ method: "GET", url: "/api/search?q=quokkamarker&type=pdf" });
    expect((otherType.json() as { results: SearchHit[] }).results).toHaveLength(0);
  });

  it("excludes soft-deleted items from results", async () => {
    const id = await saveAndExtract({
      url: "https://example.com/del",
      title: "Doomed",
      html: "<html><body><article><h1>Doomed</h1><p>This page mentions the platypusmarker before being deleted.</p></article></body></html>",
    });
    expect(
      (await auth({ method: "GET", url: "/api/search?q=platypusmarker" })).json(),
    ).toMatchObject({ results: [{ itemId: id }] });

    await auth({ method: "DELETE", url: `/api/items/${id}` });
    expect((await auth({ method: "GET", url: "/api/search?q=platypusmarker" })).json()).toEqual({
      results: [],
    });
  });

  it("rejects a missing query with 400", async () => {
    const res = await auth({ method: "GET", url: "/api/search" });
    expect(res.statusCode).toBe(400);
  });

  it("supports the full flow: save → extract → search → open content (TASK-042)", async () => {
    const id = await saveAndExtract({
      url: "https://example.com/flow",
      title: "Local-first indexing",
      html: "<html><body><article><h1>Local-first indexing</h1><p>Sourdex keeps a wombatmarker index on disk so search works fully offline.</p></article></body></html>",
    });

    const search = await auth({ method: "GET", url: "/api/search?q=wombatmarker" });
    const { results } = search.json() as { results: SearchHit[] };
    expect(results).toHaveLength(1);
    expect(results[0]?.itemId).toBe(id);

    const content = await auth({ method: "GET", url: `/api/items/${results[0]?.itemId}/content` });
    expect(content.statusCode).toBe(200);
    expect((content.json() as { plainText: string | null }).plainText).toContain("wombatmarker");
  });
});
