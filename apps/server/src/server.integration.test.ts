import type { InjectOptions } from "fastify";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createTestServer, type TestServer } from "./testing.js";

let server: TestServer;

const samplePage = {
  url: "https://example.com/post",
  title: "Example Post",
  html: "<html><body><article><h1>Example Post</h1><p>hello world</p></article></body></html>",
  selectedText: "hello world",
};

/** Inject with the paired token attached (most endpoints require it, OQ-A1). */
function auth(opts: InjectOptions) {
  return server.app.inject({
    ...opts,
    headers: { ...server.authHeaders, ...opts.headers },
  });
}

beforeEach(async () => {
  server = await createTestServer();
});

afterEach(async () => {
  await server.cleanup();
});

describe("server integration", () => {
  it("reports health (public) and status (authed)", async () => {
    const health = await server.app.inject({ method: "GET", url: "/api/health" });
    expect(health.statusCode).toBe(200);
    expect(health.json()).toEqual({ status: "ok" });

    const status = await auth({ method: "GET", url: "/api/status" });
    expect(status.json()).toMatchObject({ status: "ok", host: "127.0.0.1" });
  });

  it("saves a webpage, stores raw html, and lists/reads it", async () => {
    const saved = await auth({ method: "POST", url: "/api/captures/webpage", payload: samplePage });
    expect(saved.statusCode).toBe(201);
    const body = saved.json() as { itemId: string; status: string; jobIds: string[] };
    expect(body.status).toBe("saved");
    expect(body.jobIds).toHaveLength(1);

    const list = await auth({ method: "GET", url: "/api/items" });
    expect(list.json()).toMatchObject({ total: 1 });

    const detail = await auth({ method: "GET", url: `/api/items/${body.itemId}` });
    const detailBody = detail.json() as {
      item: { title: string; status: string; domain: string };
      capture: { extractionStatus: string; rawHtmlPath: string };
    };
    expect(detailBody.item.title).toBe("Example Post");
    expect(detailBody.item.domain).toBe("example.com");
    expect(detailBody.capture.extractionStatus).toBe("pending");
    expect(detailBody.capture.rawHtmlPath).toContain("files/raw-html/");
  });

  it("does not block the save when extraction has not run (capture stays pending)", async () => {
    const saved = await auth({ method: "POST", url: "/api/captures/webpage", payload: samplePage });
    const { itemId } = saved.json() as { itemId: string };
    const detail = await auth({ method: "GET", url: `/api/items/${itemId}` });
    expect((detail.json() as { item: { aiStatus: string } }).item.aiStatus).toBe("none");
  });

  it("dedupes by source hash, but forceNew creates a new item", async () => {
    const first = await auth({ method: "POST", url: "/api/captures/webpage", payload: samplePage });
    const firstId = (first.json() as { itemId: string }).itemId;

    const dupe = await auth({ method: "POST", url: "/api/captures/webpage", payload: samplePage });
    expect(dupe.statusCode).toBe(200);
    expect(dupe.json()).toMatchObject({ itemId: firstId, status: "exists" });

    const forced = await auth({
      method: "POST",
      url: "/api/captures/webpage",
      payload: { ...samplePage, forceNew: true },
    });
    expect(forced.statusCode).toBe(201);
    expect((forced.json() as { itemId: string }).itemId).not.toBe(firstId);
  });

  it("updates status and soft-deletes (excluded from listing)", async () => {
    const saved = await auth({ method: "POST", url: "/api/captures/webpage", payload: samplePage });
    const { itemId } = saved.json() as { itemId: string };

    const patched = await auth({
      method: "PATCH",
      url: `/api/items/${itemId}`,
      payload: { status: "archived" },
    });
    expect((patched.json() as { status: string }).status).toBe("archived");

    const deleted = await auth({ method: "DELETE", url: `/api/items/${itemId}` });
    expect(deleted.json()).toMatchObject({ status: "deleted" });

    const list = await auth({ method: "GET", url: "/api/items" });
    expect(list.json()).toMatchObject({ total: 0 });
  });

  it("keeps a saved selection in the FTS index after extraction runs (TASK-030)", async () => {
    const selection = "zzqxselectionmarker phrase";
    const saved = await auth({
      method: "POST",
      url: "/api/captures/webpage",
      payload: {
        url: "https://example.com/sel",
        title: "Selection host",
        // The selection text is intentionally NOT present in the page body, so it only
        // stays findable if the extract job re-indexes it (the full-text search API is
        // exposed in STAGE-08; here we assert the index directly).
        html: "<html><body><article><h1>Selection host</h1><p>an unrelated article body that is long enough to extract cleanly</p></article></body></html>",
        selectedText: selection,
      },
    });
    expect(saved.statusCode).toBe(201);

    // Run the background extraction job (which re-indexes FTS).
    await server.container.worker.processOnce();

    const hits = server.container.searchRepo.search("zzqxselectionmarker");
    expect(hits.length).toBe(1);
  });

  it("serves extracted readable content after extraction (Reader, TASK-037)", async () => {
    const saved = await auth({
      method: "POST",
      url: "/api/captures/webpage",
      payload: {
        url: "https://example.com/article",
        title: "Readable Article",
        html: "<html><body><article><h1>Readable Article</h1><p>The body of the article is long enough to extract.</p></article></body></html>",
      },
    });
    const { itemId } = saved.json() as { itemId: string };
    await server.container.worker.processOnce();

    const content = await auth({ method: "GET", url: `/api/items/${itemId}/content` });
    expect(content.statusCode).toBe(200);
    const body = content.json() as { markdown: string | null; plainText: string | null };
    expect(body.markdown).toContain("Readable Article");
    expect(body.plainText).toContain("body of the article");
  });

  it("returns 400 for invalid input and 404 for a missing item", async () => {
    const bad = await auth({
      method: "POST",
      url: "/api/captures/webpage",
      payload: { url: "not-a-url", title: "x", html: "<p>x</p>" },
    });
    expect(bad.statusCode).toBe(400);

    const missing = await auth({ method: "GET", url: "/api/items/item_nope" });
    expect(missing.statusCode).toBe(404);
  });
});
