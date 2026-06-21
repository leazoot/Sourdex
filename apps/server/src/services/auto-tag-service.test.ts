import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  AiOutputRepository,
  createMemoryDb,
  ItemRepository,
  TagRepository,
  type SqliteDatabase,
} from "@sourdex/db";
import { AutoTagService } from "./auto-tag-service.js";

let sqlite: SqliteDatabase;
let tagRepo: TagRepository;
let aiOutputRepo: AiOutputRepository;
let itemRepo: ItemRepository;
let svc: AutoTagService;

const META = { provider: "openai-compatible", model: "gpt-test" };

beforeEach(() => {
  const mem = createMemoryDb();
  sqlite = mem.sqlite;
  tagRepo = new TagRepository(mem.db);
  aiOutputRepo = new AiOutputRepository(mem.db);
  itemRepo = new ItemRepository(mem.db);
  svc = new AutoTagService({ tagRepo, aiOutputRepo });
});

afterEach(() => {
  sqlite.close();
});

function newItem(): string {
  return itemRepo.create({ type: "webpage", title: "T", url: "https://x.test" }).id;
}

function tagNames(itemId: string): string[] {
  return tagRepo
    .listByItem(itemId)
    .map((t) => t.normalizedName)
    .sort();
}

describe("AutoTagService", () => {
  it("normalizes, dedupes and applies suggested tags with an ai output record", () => {
    const id = newItem();
    const applied = svc.applySuggestedTags(id, ["SQLite", " sqlite ", "FTS5"], META);

    expect(applied.length).toBe(2);
    expect(tagNames(id)).toEqual(["fts5", "sqlite"]);
    // Tags are created as AI tags and associated as AI source.
    expect(tagRepo.findByNormalizedName("sqlite")?.type).toBe("ai");

    const output = aiOutputRepo.findLatestByItem(id, "tags");
    expect(output?.model).toBe("gpt-test");
    expect(JSON.parse(output!.output).tags.length).toBe(2);
  });

  it("drops generic and over-length tags (PRD §14.4)", () => {
    const id = newItem();
    const long = "a".repeat(21);
    svc.applySuggestedTags(id, ["文章", "content", long, "Drizzle"], META);
    expect(tagNames(id)).toEqual(["drizzle"]);
  });

  it("caps new tags at 3 but still reuses existing tags beyond that", () => {
    const id = newItem();
    // Pre-create two existing global tags (not yet on the item).
    tagRepo.upsert("React", "manual");
    tagRepo.upsert("Vite", "manual");

    const applied = svc.applySuggestedTags(
      id,
      ["React", "Vite", "new1", "new2", "new3", "new4", "new5"],
      META,
    );

    // 2 reused + 3 new (new4/new5 dropped by the new-tag cap) = 5, under the 7 cap.
    expect(applied.length).toBe(5);
    const names = tagNames(id);
    expect(names).toContain("react");
    expect(names).toContain("vite");
    expect(names.filter((n) => n.startsWith("new")).length).toBe(3);
  });

  it("respects the 7-tags-per-item cap and never removes existing tags", () => {
    const id = newItem();
    // Item already has 6 manual tags.
    for (const n of ["m1", "m2", "m3", "m4", "m5", "m6"]) {
      const t = tagRepo.upsert(n, "manual");
      tagRepo.attachToItem(id, t.id, { source: "manual" });
    }
    tagRepo.upsert("existing", "manual"); // reusable global tag

    const applied = svc.applySuggestedTags(id, ["existing", "brand1", "brand2"], META);

    expect(applied.length).toBe(1); // only one free slot
    expect(tagNames(id)).toEqual(["existing", "m1", "m2", "m3", "m4", "m5", "m6"]);
  });

  it("skips tags already on the item and writes no output when nothing is applied", () => {
    const id = newItem();
    const t = tagRepo.upsert("kept", "manual");
    tagRepo.attachToItem(id, t.id, { source: "manual" });

    const applied = svc.applySuggestedTags(id, ["kept", "文章"], META);

    expect(applied.length).toBe(0);
    expect(tagNames(id)).toEqual(["kept"]);
    expect(aiOutputRepo.findLatestByItem(id, "tags")).toBeNull();
  });
});
