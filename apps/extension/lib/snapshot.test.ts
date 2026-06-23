// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { buildSnapshot, type SnapshotEnv, type SnapshotOptions } from "./snapshot";

function parse(html: string): Document {
  return new DOMParser().parseFromString(html, "text/html");
}

function makeEnv(over: Partial<SnapshotEnv> = {}): SnapshotEnv {
  return {
    fetchText: async () => null,
    fetchDataUri: async () => null,
    now: () => 0,
    ...over,
  };
}

const OPTS: SnapshotOptions = { deadlineMs: 1000, maxBytes: 5_000_000 };

describe("buildSnapshot", () => {
  it("removes scripts and noscript", async () => {
    const doc = parse(
      "<html><body><p>keep</p><script>evil()</script><noscript>x</noscript></body></html>",
    );
    const html = await buildSnapshot(doc, makeEnv(), OPTS);
    expect(html).toContain("keep");
    expect(html).not.toContain("evil()");
    expect(html?.toLowerCase()).not.toContain("<script");
  });

  it("inlines a stylesheet link into a <style> tag", async () => {
    const doc = parse(
      '<html><head><link rel="stylesheet" href="https://cdn.test/app.css"></head><body>hi</body></html>',
    );
    const html = await buildSnapshot(
      doc,
      makeEnv({ fetchText: async () => ".x{color:red}" }),
      OPTS,
    );
    expect(html).toContain("<style>.x{color:red}</style>");
    expect(html).not.toContain("<link");
  });

  it("drops a stylesheet link that cannot be fetched", async () => {
    const doc = parse(
      '<html><head><link rel="stylesheet" href="https://cdn.test/app.css"></head><body>hi</body></html>',
    );
    const html = await buildSnapshot(doc, makeEnv({ fetchText: async () => null }), OPTS);
    expect(html).not.toContain("<link");
    expect(html).not.toContain("app.css");
  });

  it("inlines images as data URIs and strips srcset", async () => {
    const doc = parse(
      '<html><body><img src="https://cdn.test/a.png" srcset="https://cdn.test/a-2x.png 2x"></body></html>',
    );
    const html = await buildSnapshot(
      doc,
      makeEnv({ fetchDataUri: async () => "data:image/png;base64,AAAA" }),
      OPTS,
    );
    expect(html).toContain("data:image/png;base64,AAAA");
    expect(html).not.toContain("srcset");
    expect(html).not.toContain("cdn.test/a.png");
  });

  it("leaves existing data: image src untouched", async () => {
    const doc = parse('<html><body><img src="data:image/gif;base64,ZZ"></body></html>');
    let called = 0;
    const html = await buildSnapshot(
      doc,
      makeEnv({
        fetchDataUri: async () => {
          called++;
          return "data:nope";
        },
      }),
      OPTS,
    );
    expect(called).toBe(0);
    expect(html).toContain("data:image/gif;base64,ZZ");
  });

  it("removes an image src when no data URI is available", async () => {
    const doc = parse('<html><body><img src="https://cdn.test/a.png"></body></html>');
    const html = await buildSnapshot(doc, makeEnv({ fetchDataUri: async () => null }), OPTS);
    expect(html).not.toContain("cdn.test/a.png");
  });

  it("returns null when the result exceeds maxBytes", async () => {
    const doc = parse(`<html><body><p>${"x".repeat(1000)}</p></body></html>`);
    const html = await buildSnapshot(doc, makeEnv(), { deadlineMs: 1000, maxBytes: 100 });
    expect(html).toBeNull();
  });

  it("stops inlining images once the deadline passes (best-effort)", async () => {
    const doc = parse(
      '<html><body><img src="https://cdn.test/a.png"><img src="https://cdn.test/b.png"></body></html>',
    );
    let clock = 0;
    let fetches = 0;
    const html = await buildSnapshot(
      doc,
      makeEnv({
        now: () => (clock += 5000), // first overDeadline() check trips immediately
        fetchDataUri: async () => {
          fetches++;
          return "data:image/png;base64,AAAA";
        },
      }),
      { deadlineMs: 1000, maxBytes: 5_000_000 },
    );
    expect(fetches).toBe(0); // deadline tripped before any image fetch
    expect(html).not.toContain("cdn.test");
  });
});
