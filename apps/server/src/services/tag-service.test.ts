import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { NotFoundError, ValidationError } from "@sourdex/core";
import {
  AnnotationRepository,
  CaptureRepository,
  createMemoryDb,
  ItemRepository,
  SearchRepository,
  TagRepository,
  type SqliteDatabase,
} from "@sourdex/db";
import { LocalStorage } from "../infrastructure/storage/local-storage.js";
import { TagService } from "./tag-service.js";

let sqlite: SqliteDatabase;
let root: string;
let svc: TagService;
let itemRepo: ItemRepository;
let tagRepo: TagRepository;
let searchRepo: SearchRepository;
let itemId: string;

beforeEach(async () => {
  const mem = createMemoryDb();
  sqlite = mem.sqlite;
  root = mkdtempSync(join(tmpdir(), "sourdex-tags-"));
  itemRepo = new ItemRepository(mem.db);
  tagRepo = new TagRepository(mem.db);
  searchRepo = new SearchRepository(mem.db);
  const captureRepo = new CaptureRepository(mem.db);
  const storage = new LocalStorage(root);
  svc = new TagService({
    annotationRepo: new AnnotationRepository(mem.db),
    itemRepo,
    captureRepo,
    tagRepo,
    searchRepo,
    storage,
  });

  const item = itemRepo.create({ type: "webpage", title: "Local-first" });
  itemId = item.id;
  const textPath = await storage.write(`files/text/${item.id}.txt`, "The body text about CRDTs.");
  captureRepo.create({ itemId, originalTextPath: textPath, extractionStatus: "success" });
});

afterEach(() => {
  sqlite.close();
  rmSync(root, { recursive: true, force: true });
});

function attachAndIndex(name: string): string {
  const tag = tagRepo.upsert(name);
  tagRepo.attachToItem(itemId, tag.id);
  searchRepo.index({
    itemId,
    title: "Local-first",
    plainText: "The body text about CRDTs.",
    tags: tagRepo
      .listByItem(itemId)
      .map((t) => t.name)
      .join(" "),
  });
  return tag.id;
}

describe("TagService", () => {
  it("lists tags with counts", () => {
    attachAndIndex("sqlite");
    const list = svc.list();
    expect(list.find((t) => t.name === "sqlite")?.count).toBe(1);
  });

  it("renames a tag and updates the search index", async () => {
    const id = attachAndIndex("sqlit3");
    const result = await svc.rename(id, "litestream");
    expect(result.merged).toBe(false);
    expect(result.tag.name).toBe("litestream");
    expect(searchRepo.search("litestream").some((h) => h.itemId === itemId)).toBe(true);
    expect(searchRepo.search("sqlit3").some((h) => h.itemId === itemId)).toBe(false);
  });

  it("renaming onto an existing tag merges into it", async () => {
    const source = attachAndIndex("dbs");
    tagRepo.upsert("databases");
    const result = await svc.rename(source, "databases");
    expect(result.merged).toBe(true);
    expect(result.tag.name).toBe("databases");
    expect(tagRepo.findById(source)).toBeNull();
    expect(tagRepo.listByItem(itemId).map((t) => t.name)).toContain("databases");
  });

  it("merges one tag into another and re-indexes affected items", async () => {
    const source = attachAndIndex("sqlite");
    const target = tagRepo.upsert("databases");
    await svc.merge(source, target.id);
    expect(tagRepo.findById(source)).toBeNull();
    expect(searchRepo.search("databases").some((h) => h.itemId === itemId)).toBe(true);
    expect(searchRepo.search("sqlite").some((h) => h.itemId === itemId)).toBe(false);
  });

  it("deletes a tag, dropping it from search while leaving the body searchable", async () => {
    const id = attachAndIndex("ephemeral");
    await svc.delete(id);
    expect(tagRepo.findById(id)).toBeNull();
    expect(searchRepo.search("ephemeral").some((h) => h.itemId === itemId)).toBe(false);
    expect(searchRepo.search("body").some((h) => h.itemId === itemId)).toBe(true);
  });

  it("guards invalid input and missing tags", async () => {
    await expect(svc.rename("tag_missing", "x")).rejects.toBeInstanceOf(NotFoundError);
    const id = attachAndIndex("real");
    await expect(svc.rename(id, "   ")).rejects.toBeInstanceOf(ValidationError);
    await expect(svc.merge(id, id)).rejects.toBeInstanceOf(ValidationError);
    await expect(svc.merge(id, "tag_missing")).rejects.toBeInstanceOf(NotFoundError);
    await expect(svc.delete("tag_missing")).rejects.toBeInstanceOf(NotFoundError);
  });
});
