import {
  createId,
  NotFoundError,
  nowIso,
  type Capture,
  type ContentKind,
  type CreateCaptureInput,
  type ExtractionStatus,
} from "@sourdex/core";
import { eq } from "drizzle-orm";
import type { Db } from "../client.js";
import { captures } from "../schema.js";
import { mapCapture } from "../mappers.js";

/** Fields updated when an extraction job finishes. */
export interface UpdateExtractionInput {
  readableHtmlPath?: string | null;
  markdownPath?: string | null;
  originalTextPath?: string | null;
  screenshotPath?: string | null;
  extractionStatus: ExtractionStatus;
  extractionError?: string | null;
  contentKind?: ContentKind | null;
}

/** Data access for raw captures (PRD §10.1). */
export class CaptureRepository {
  constructor(private readonly db: Db) {}

  create(input: CreateCaptureInput): Capture {
    const row = this.db
      .insert(captures)
      .values({
        id: createId("cap"),
        itemId: input.itemId,
        rawHtmlPath: input.rawHtmlPath ?? null,
        readableHtmlPath: input.readableHtmlPath ?? null,
        markdownPath: input.markdownPath ?? null,
        screenshotPath: input.screenshotPath ?? null,
        originalTextPath: input.originalTextPath ?? null,
        extractionStatus: input.extractionStatus ?? "pending",
        extractionError: input.extractionError ?? null,
        createdAt: nowIso(),
      })
      .returning()
      .get();
    return mapCapture(row);
  }

  findById(id: string): Capture | null {
    const row = this.db.select().from(captures).where(eq(captures.id, id)).get();
    return row ? mapCapture(row) : null;
  }

  findByItemId(itemId: string): Capture | null {
    const row = this.db.select().from(captures).where(eq(captures.itemId, itemId)).get();
    return row ? mapCapture(row) : null;
  }

  updateExtraction(id: string, input: UpdateExtractionInput): Capture {
    const patch: Partial<typeof captures.$inferInsert> = {
      extractionStatus: input.extractionStatus,
    };
    if (input.readableHtmlPath !== undefined) patch.readableHtmlPath = input.readableHtmlPath;
    if (input.markdownPath !== undefined) patch.markdownPath = input.markdownPath;
    if (input.originalTextPath !== undefined) patch.originalTextPath = input.originalTextPath;
    if (input.screenshotPath !== undefined) patch.screenshotPath = input.screenshotPath;
    if (input.extractionError !== undefined) patch.extractionError = input.extractionError;
    if (input.contentKind !== undefined) patch.contentKind = input.contentKind;

    const row = this.db.update(captures).set(patch).where(eq(captures.id, id)).returning().get();
    if (!row) throw new NotFoundError(`Capture not found: ${id}`);
    return mapCapture(row);
  }
}
