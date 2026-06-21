import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { NotFoundError } from "@sourdex/core";
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
import { AnnotationService } from "./annotation-service.js";

let sqlite: SqliteDatabase;
let root: string;
let svc: AnnotationService;
let itemRepo: ItemRepository;
let captureRepo: CaptureRepository;
let searchRepo: SearchRepository;
let storage: LocalStorage;
let itemId: string;

beforeEach(async () => {
  const mem = createMemoryDb();
  sqlite = mem.sqlite;
  root = mkdtempSync(join(tmpdir(), "sourdex-anno-"));
  itemRepo = new ItemRepository(mem.db);
  captureRepo = new CaptureRepository(mem.db);
  searchRepo = new SearchRepository(mem.db);
  storage = new LocalStorage(root);
  svc = new AnnotationService({
    annotationRepo: new AnnotationRepository(mem.db),
    itemRepo,
    captureRepo,
    tagRepo: new TagRepository(mem.db),
    searchRepo,
    storage,
  });

  const item = itemRepo.create({ type: "webpage", title: "Local-first", url: "https://x.test" });
  itemId = item.id;
  const textPath = await storage.write(`files/text/${item.id}.txt`, "The body text about CRDTs.");
  captureRepo.create({ itemId, originalTextPath: textPath, extractionStatus: "success" });
  searchRepo.index({ itemId, title: item.title, plainText: "The body text about CRDTs." });
});

afterEach(() => {
  sqlite.close();
  rmSync(root, { recursive: true, force: true });
});

describe("AnnotationService", () => {
  it("creates an annotation and makes its note searchable (PRD §5.2.5.4)", async () => {
    await svc.create(itemId, {
      selectedText: "CRDTs",
      note: "zebraword merge insight",
      color: "amber",
    });

    expect(svc.listByItem(itemId)).toHaveLength(1);
    // The note text is now found by full-text search (folded into the FTS summary field).
    const hits = searchRepo.search("zebraword");
    expect(hits.some((h) => h.itemId === itemId)).toBe(true);
  });

  it("404s when annotating a missing item", async () => {
    await expect(svc.create("item_missing", { selectedText: "x" })).rejects.toBeInstanceOf(
      NotFoundError,
    );
  });

  it("updates and deletes, re-indexing each time", async () => {
    const a = await svc.create(itemId, { selectedText: "CRDTs", note: "old" });
    const updated = await svc.update(a.id, { note: "newnote koalaword" });
    expect(updated.note).toBe("newnote koalaword");
    expect(searchRepo.search("koalaword").some((h) => h.itemId === itemId)).toBe(true);

    await svc.delete(a.id);
    expect(svc.listByItem(itemId)).toEqual([]);
    // After deletion the note text is no longer indexed.
    expect(searchRepo.search("koalaword").some((h) => h.itemId === itemId)).toBe(false);
    // Original content is untouched and still searchable.
    expect(searchRepo.search("body").some((h) => h.itemId === itemId)).toBe(true);
  });

  it("404s on update/delete of a missing annotation", async () => {
    await expect(svc.update("anno_missing", { note: "x" })).rejects.toBeInstanceOf(NotFoundError);
    await expect(svc.delete("anno_missing")).rejects.toBeInstanceOf(NotFoundError);
  });
});
