import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createMemoryDb } from "../testing.js";
import type { Db, SqliteDatabase } from "../client.js";
import { CaptureRepository } from "./capture-repository.js";
import { ItemRepository } from "./item-repository.js";

let sqlite: SqliteDatabase;
let db: Db;
let captureRepo: CaptureRepository;
let itemId: string;

beforeEach(() => {
  ({ sqlite, db } = createMemoryDb());
  captureRepo = new CaptureRepository(db);
  itemId = new ItemRepository(db).create({ type: "webpage", title: "Host" }).id;
});

afterEach(() => {
  sqlite.close();
});

describe("CaptureRepository", () => {
  it("creates a capture with pending status and no content kind by default", () => {
    const capture = captureRepo.create({ itemId, rawHtmlPath: "files/raw-html/x.html" });
    expect(capture.id).toMatch(/^cap_/);
    expect(capture.extractionStatus).toBe("pending");
    expect(capture.contentKind).toBeNull();
    expect(captureRepo.findByItemId(itemId)?.id).toBe(capture.id);
  });

  it("updates extraction result paths, status and content kind", () => {
    const capture = captureRepo.create({ itemId, extractionStatus: "pending" });
    const updated = captureRepo.updateExtraction(capture.id, {
      markdownPath: "files/markdown/x.md",
      originalTextPath: "files/text/x.txt",
      extractionStatus: "success",
      contentKind: "fulltext",
    });
    expect(updated.extractionStatus).toBe("success");
    expect(updated.markdownPath).toBe("files/markdown/x.md");
    expect(updated.contentKind).toBe("fulltext");
    expect(captureRepo.findById(capture.id)?.contentKind).toBe("fulltext");
  });

  it("records extraction failure (fallback keeps the item usable)", () => {
    const capture = captureRepo.create({ itemId, extractionStatus: "pending" });
    const failed = captureRepo.updateExtraction(capture.id, {
      extractionStatus: "failed",
      extractionError: "readability returned empty",
    });
    expect(failed.extractionStatus).toBe("failed");
    expect(failed.extractionError).toContain("empty");
  });
});
