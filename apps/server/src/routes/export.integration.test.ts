import { readFileSync } from "node:fs";
import { join } from "node:path";
import { strFromU8, unzipSync } from "fflate";
import type { InjectOptions } from "fastify";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createTestServer, type TestServer } from "../testing.js";

let server: TestServer;

function auth(opts: InjectOptions) {
  return server.app.inject({ ...opts, headers: { ...server.authHeaders, ...opts.headers } });
}

async function saveAndExtract(payload: {
  url: string;
  title: string;
  html: string;
}): Promise<string> {
  const saved = await auth({ method: "POST", url: "/api/captures/webpage", payload });
  const { itemId } = saved.json() as { itemId: string };
  await server.container.worker.processOnce();
  return itemId;
}

function readExport(path: string): Uint8Array {
  return new Uint8Array(readFileSync(join(server.config.dataDir, path)));
}

interface ExportResp {
  exportId: string;
  path: string;
  count: number;
  failed: { itemId: string; reason: string }[];
}

beforeEach(async () => {
  server = await createTestServer();
});

afterEach(async () => {
  await server.cleanup();
});

describe("POST /api/export/markdown (TASK-045)", () => {
  it("exports a single item to a .md file with frontmatter and content", async () => {
    const id = await saveAndExtract({
      url: "https://example.com/one",
      title: "Single Export",
      html: "<html><body><article><h1>Single Export</h1><p>The body of this article is long enough to extract cleanly.</p></article></body></html>",
    });

    const res = await auth({
      method: "POST",
      url: "/api/export/markdown",
      payload: { itemIds: [id], format: "markdown" },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json() as ExportResp;
    expect(body.path.endsWith(".md")).toBe(true);
    expect(body.count).toBe(1);
    expect(body.failed).toEqual([]);

    const doc = strFromU8(readExport(body.path));
    expect(doc).toContain(`title: "Single Export"`);
    expect(doc).toContain("# Single Export");
    expect(doc).toContain("## Content");
    expect(doc).toContain("body of this article");
  });

  it("exports multiple items as a zip; obsidian groups by domain folder", async () => {
    const a = await saveAndExtract({
      url: "https://alpha.com/a",
      title: "Alpha Doc",
      html: "<html><body><article><h1>Alpha Doc</h1><p>Alpha content that is long enough to extract.</p></article></body></html>",
    });
    const b = await saveAndExtract({
      url: "https://beta.com/b",
      title: "Beta Doc",
      html: "<html><body><article><h1>Beta Doc</h1><p>Beta content that is long enough to extract.</p></article></body></html>",
    });

    const res = await auth({
      method: "POST",
      url: "/api/export/markdown",
      payload: { itemIds: [a, b], format: "obsidian" },
    });
    const body = res.json() as ExportResp;
    expect(body.path.endsWith(".zip")).toBe(true);
    expect(body.count).toBe(2);

    const entries = unzipSync(readExport(body.path));
    const names = Object.keys(entries);
    expect(names).toContain("alpha.com/Alpha Doc.md");
    expect(names).toContain("beta.com/Beta Doc.md");
    expect(strFromU8(entries["alpha.com/Alpha Doc.md"]!)).toContain(`title: "Alpha Doc"`);
  });

  it("skips missing items and reports them (OQ-R2)", async () => {
    const id = await saveAndExtract({
      url: "https://example.com/keep",
      title: "Kept",
      html: "<html><body><article><h1>Kept</h1><p>This article is kept and long enough to extract.</p></article></body></html>",
    });

    const res = await auth({
      method: "POST",
      url: "/api/export/markdown",
      payload: { itemIds: [id, "item_missing"], format: "markdown" },
    });
    const body = res.json() as ExportResp;
    expect(body.count).toBe(1);
    expect(body.failed).toEqual([{ itemId: "item_missing", reason: "not_found" }]);
  });

  it("rejects an empty itemIds list with 400", async () => {
    const res = await auth({
      method: "POST",
      url: "/api/export/markdown",
      payload: { itemIds: [], format: "markdown" },
    });
    expect(res.statusCode).toBe(400);
  });

  it("rejects a request with neither itemIds nor scope (400)", async () => {
    const res = await auth({
      method: "POST",
      url: "/api/export/markdown",
      payload: { format: "json" },
    });
    expect(res.statusCode).toBe(400);
  });
});

describe("Export formats & scope (STAGE-19)", () => {
  it("exports JSON as a single structured file", async () => {
    const id = await saveAndExtract({
      url: "https://example.com/j",
      title: "JSON Source",
      html: "<html><body><article><h1>JSON Source</h1><p>Body content that extracts cleanly enough.</p></article></body></html>",
    });

    const res = await auth({
      method: "POST",
      url: "/api/export/markdown",
      payload: { itemIds: [id], format: "json" },
    });
    const body = res.json() as ExportResp;
    expect(body.path.endsWith(".json")).toBe(true);
    expect(body.count).toBe(1);

    const parsed = JSON.parse(strFromU8(readExport(body.path))) as {
      count: number;
      items: { title: string; content: string }[];
    };
    expect(parsed.count).toBe(1);
    expect(parsed.items[0]?.title).toBe("JSON Source");
    expect(parsed.items[0]?.content).toContain("Body content");
  });

  it("exports CSV with a header row and resolves scope=all", async () => {
    await saveAndExtract({
      url: "https://a.com/1",
      title: "First",
      html: "<html><body><article><h1>First</h1><p>First body long enough to extract here.</p></article></body></html>",
    });
    await saveAndExtract({
      url: "https://b.com/2",
      title: "Second",
      html: "<html><body><article><h1>Second</h1><p>Second body long enough to extract here.</p></article></body></html>",
    });

    const res = await auth({
      method: "POST",
      url: "/api/export/markdown",
      payload: { scope: { type: "all" }, format: "csv" },
    });
    const body = res.json() as ExportResp;
    expect(body.path.endsWith(".csv")).toBe(true);
    expect(body.count).toBe(2);

    const csv = strFromU8(readExport(body.path));
    expect(csv.split("\r\n")[0]).toBe("title,url,domain,type,saved_at,tags");
  });

  it("resolves scope=tag to the items carrying that tag", async () => {
    const tagged = await saveAndExtract({
      url: "https://t.com/1",
      title: "Tagged Item",
      html: "<html><body><article><h1>Tagged Item</h1><p>Tagged body long enough to extract here.</p></article></body></html>",
    });
    await saveAndExtract({
      url: "https://t.com/2",
      title: "Untagged Item",
      html: "<html><body><article><h1>Untagged Item</h1><p>Untagged body long enough to extract.</p></article></body></html>",
    });
    const tag = server.container.tagRepo.upsert("local-first");
    server.container.tagRepo.attachToItem(tagged, tag.id);

    const res = await auth({
      method: "POST",
      url: "/api/export/markdown",
      payload: { scope: { type: "tag", tagId: tag.id }, format: "json" },
    });
    const body = res.json() as ExportResp;
    expect(body.count).toBe(1);
    const parsed = JSON.parse(strFromU8(readExport(body.path))) as {
      items: { title: string }[];
    };
    expect(parsed.items[0]?.title).toBe("Tagged Item");
  });
});
