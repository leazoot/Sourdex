import type { InjectOptions } from "fastify";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { Annotation } from "@sourdex/core";
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
      url: "https://example.com/anno",
      title: "Annotation target",
      html: "<html><body><article><h1>Annotation target</h1><p>A page about local-first software and CRDTs.</p></article></body></html>",
    },
  });
  const { itemId } = res.json() as { itemId: string };
  await server.container.worker.processOnce();
  return itemId;
}

beforeEach(async () => {
  server = await createTestServer();
});

afterEach(async () => {
  await server.cleanup();
});

describe("Annotations API (STAGE-18)", () => {
  it("creates, lists, updates and deletes a highlight + note", async () => {
    const itemId = await saveAndExtract();

    const created = await auth({
      method: "POST",
      url: `/api/items/${itemId}/annotations`,
      payload: { selectedText: "local-first software", note: "key idea", color: "amber" },
    });
    expect(created.statusCode).toBe(201);
    const anno = created.json() as Annotation;
    expect(anno.selectedText).toBe("local-first software");

    const list = await auth({ method: "GET", url: `/api/items/${itemId}/annotations` });
    expect((list.json() as { annotations: Annotation[] }).annotations).toHaveLength(1);

    const patched = await auth({
      method: "PATCH",
      url: `/api/annotations/${anno.id}`,
      payload: { note: "updated note" },
    });
    expect((patched.json() as Annotation).note).toBe("updated note");

    const del = await auth({ method: "DELETE", url: `/api/annotations/${anno.id}` });
    expect(del.statusCode).toBe(204);
    const after = await auth({ method: "GET", url: `/api/items/${itemId}/annotations` });
    expect((after.json() as { annotations: Annotation[] }).annotations).toEqual([]);
  });

  it("404s when annotating a missing item", async () => {
    const res = await auth({
      method: "POST",
      url: "/api/items/item_missing/annotations",
      payload: { selectedText: "x" },
    });
    expect(res.statusCode).toBe(404);
  });

  it("makes a note searchable, then unsearchable after deletion (PRD §5.2.5.4)", async () => {
    const itemId = await saveAndExtract();
    const created = await auth({
      method: "POST",
      url: `/api/items/${itemId}/annotations`,
      payload: { selectedText: "CRDTs", note: "platypusnote insight" },
    });
    const anno = created.json() as Annotation;

    const hit = await auth({ method: "GET", url: "/api/search?q=platypusnote" });
    expect((hit.json() as { results: { itemId: string }[] }).results).toHaveLength(1);

    await auth({ method: "DELETE", url: `/api/annotations/${anno.id}` });
    const gone = await auth({ method: "GET", url: "/api/search?q=platypusnote" });
    expect((gone.json() as { results: unknown[] }).results).toEqual([]);
  });
});
