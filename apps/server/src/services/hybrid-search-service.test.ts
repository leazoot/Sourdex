import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  ItemRepository,
  SearchRepository,
  TagRepository,
  createMemoryDb,
  type SqliteDatabase,
} from "@sourdex/db";
import { HybridSearchService } from "./hybrid-search-service.js";
import type { SemanticSearchHit } from "./semantic-search-service.js";

let sqlite: SqliteDatabase;
let itemRepo: ItemRepository;
let searchRepo: SearchRepository;
let tagRepo: TagRepository;

const NOW = Date.parse("2026-06-21T00:00:00.000Z");

/** A stub semantic service so tests don't touch a provider/network. */
function stubSemantic(enabled: boolean, hits: SemanticSearchHit[]) {
  return {
    enabledProvider: () => (enabled ? ({ id: "p" } as never) : null),
    search: async () => hits,
  } as const;
}

function indexItem(opts: {
  title: string;
  text: string;
  savedAt?: string;
  tags?: string[];
}): string {
  const item = itemRepo.create({
    type: "webpage",
    title: opts.title,
    url: `https://x/${opts.title}`,
  });
  if (opts.savedAt) itemRepo.update(item.id, {});
  for (const name of opts.tags ?? []) {
    const tag = tagRepo.upsert(name, "manual");
    tagRepo.attachToItem(item.id, tag.id, { source: "manual" });
  }
  searchRepo.index({
    itemId: item.id,
    title: opts.title,
    plainText: opts.text,
    tags: (opts.tags ?? []).join(" "),
  });
  return item.id;
}

beforeEach(() => {
  const mem = createMemoryDb();
  sqlite = mem.sqlite;
  itemRepo = new ItemRepository(mem.db);
  searchRepo = new SearchRepository(mem.db);
  tagRepo = new TagRepository(mem.db);
});

afterEach(() => sqlite.close());

describe("HybridSearchService", () => {
  it("blends keyword and semantic candidates into one ranked list", async () => {
    const kw = indexItem({ title: "Vector databases", text: "all about vector search indexing" });
    const semOnly = indexItem({ title: "Unrelated cooking", text: "pasta recipes and sauces" });

    const svc = new HybridSearchService({
      searchRepo,
      tagRepo,
      now: () => NOW,
      semanticSearchService: stubSemantic(true, [
        {
          itemId: semOnly,
          title: "Unrelated cooking",
          url: null,
          domain: null,
          type: "webpage",
          savedAt: new Date(NOW).toISOString(),
          chunkId: "c1",
          snippet: "semantic passage",
          score: 0.9,
        },
      ]),
    });

    const { results } = await svc.search({ q: "vector", mode: "hybrid" });
    const ids = results.map((r) => r.itemId);
    expect(ids).toContain(kw); // keyword hit
    expect(ids).toContain(semOnly); // semantic-only hit merged in
  });

  it("degrades to keyword ranking when no embedding provider is enabled (no error)", async () => {
    const kw = indexItem({ title: "Vector databases", text: "vector search indexing" });
    const svc = new HybridSearchService({
      searchRepo,
      tagRepo,
      now: () => NOW,
      semanticSearchService: stubSemantic(false, []),
    });

    const { results } = await svc.search({ q: "vector", mode: "hybrid" });
    expect(results.map((r) => r.itemId)).toEqual([kw]);
    expect(results[0].score).toBeGreaterThan(0);
  });

  it("includes a score breakdown only in debug mode", async () => {
    indexItem({ title: "Vector databases", text: "vector search", tags: ["vector"] });
    const svc = new HybridSearchService({
      searchRepo,
      tagRepo,
      now: () => NOW,
      semanticSearchService: stubSemantic(false, []),
    });

    const plain = await svc.search({ q: "vector", mode: "hybrid" });
    expect(plain.results[0].scoreBreakdown).toBeUndefined();

    const debug = await svc.search({ q: "vector", mode: "hybrid", debug: true });
    expect(debug.results[0].scoreBreakdown?.tag).toBeGreaterThan(0); // tag "vector" matched
    expect(debug.results[0].scoreBreakdown?.final).toBeCloseTo(debug.results[0].score, 2);
  });

  it("applies structured filters to semantic-only hits", async () => {
    const svc = new HybridSearchService({
      searchRepo,
      tagRepo,
      now: () => NOW,
      semanticSearchService: stubSemantic(true, [
        {
          itemId: "item_pdf",
          title: "A pdf",
          url: null,
          domain: null,
          type: "pdf",
          savedAt: new Date(NOW).toISOString(),
          chunkId: "c1",
          snippet: "x",
          score: 0.9,
        },
      ]),
    });

    // Query matches nothing in FTS; the only candidate is a semantic pdf hit, filtered out.
    const { results } = await svc.search({ q: "vector", mode: "hybrid", type: "webpage" });
    expect(results).toEqual([]);
  });
});
