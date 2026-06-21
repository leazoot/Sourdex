import type { InjectOptions } from "fastify";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { Tag, TagWithCount } from "@sourdex/core";
import { createTestServer, type TestServer } from "../testing.js";

let server: TestServer;

function auth(opts: InjectOptions) {
  return server.app.inject({ ...opts, headers: { ...server.authHeaders, ...opts.headers } });
}

/** Seed an item with a tag via repositories (no manual-tag API in v0.1). */
function seedTaggedItem(title: string, tagName: string): { itemId: string; tagId: string } {
  const item = server.container.itemRepo.create({ type: "webpage", title });
  const tag = server.container.tagRepo.upsert(tagName);
  server.container.tagRepo.attachToItem(item.id, tag.id);
  return { itemId: item.id, tagId: tag.id };
}

beforeEach(async () => {
  server = await createTestServer();
});

afterEach(async () => {
  await server.cleanup();
});

describe("Tags API (STAGE-19)", () => {
  it("lists tags with item counts", async () => {
    seedTaggedItem("A", "sqlite");
    seedTaggedItem("B", "sqlite");
    seedTaggedItem("C", "crdt");

    const res = await auth({ method: "GET", url: "/api/tags" });
    expect(res.statusCode).toBe(200);
    const { tags } = res.json() as { tags: TagWithCount[] };
    expect(tags.find((t) => t.name === "sqlite")?.count).toBe(2);
    expect(tags.find((t) => t.name === "crdt")?.count).toBe(1);
  });

  it("renames a tag", async () => {
    const { tagId } = seedTaggedItem("A", "litestrem");
    const res = await auth({
      method: "PATCH",
      url: `/api/tags/${tagId}`,
      payload: { name: "litestream" },
    });
    expect(res.statusCode).toBe(200);
    expect((res.json() as { tag: Tag; merged: boolean }).tag.name).toBe("litestream");
  });

  it("merges and deletes tags", async () => {
    const a = seedTaggedItem("A", "db");
    const b = seedTaggedItem("B", "databases");

    const merge = await auth({
      method: "POST",
      url: `/api/tags/${a.tagId}/merge`,
      payload: { targetId: b.tagId },
    });
    expect(merge.statusCode).toBe(200);
    expect(server.container.tagRepo.findById(a.tagId)).toBeNull();

    const del = await auth({ method: "DELETE", url: `/api/tags/${b.tagId}` });
    expect(del.statusCode).toBe(204);
    expect(server.container.tagRepo.findById(b.tagId)).toBeNull();
  });

  it("404s on a missing tag and validates input", async () => {
    const missing = await auth({
      method: "PATCH",
      url: "/api/tags/tag_missing",
      payload: { name: "x" },
    });
    expect(missing.statusCode).toBe(404);

    const { tagId } = seedTaggedItem("A", "real");
    const bad = await auth({ method: "PATCH", url: `/api/tags/${tagId}`, payload: { name: "" } });
    expect(bad.statusCode).toBe(400);
  });
});
