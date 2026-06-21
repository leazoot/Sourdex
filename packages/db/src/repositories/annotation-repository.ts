import { createId, nowIso, type Annotation } from "@sourdex/core";
import { asc, eq } from "drizzle-orm";
import type { Db } from "../client.js";
import { annotations } from "../schema.js";
import { mapAnnotation } from "../mappers.js";

/** Fields to create a highlight/note (PRD §12.6). `id`/timestamps are generated. */
export interface CreateAnnotationInput {
  itemId: string;
  selectedText: string;
  chunkId?: string | null;
  note?: string | null;
  color?: string | null;
}

/** Mutable fields of an annotation. `undefined` keeps a field; `null` clears it. */
export interface UpdateAnnotationInput {
  note?: string | null;
  color?: string | null;
}

/** Data access for highlights & notes (PRD §10.1, §12.6). */
export class AnnotationRepository {
  constructor(private readonly db: Db) {}

  create(input: CreateAnnotationInput): Annotation {
    const now = nowIso();
    const row = this.db
      .insert(annotations)
      .values({
        id: createId("anno"),
        itemId: input.itemId,
        chunkId: input.chunkId ?? null,
        selectedText: input.selectedText,
        note: input.note ?? null,
        color: input.color ?? null,
        createdAt: now,
        updatedAt: now,
      })
      .returning()
      .get();
    return mapAnnotation(row);
  }

  findById(id: string): Annotation | null {
    const row = this.db.select().from(annotations).where(eq(annotations.id, id)).get();
    return row ? mapAnnotation(row) : null;
  }

  listByItem(itemId: string): Annotation[] {
    const rows = this.db
      .select()
      .from(annotations)
      .where(eq(annotations.itemId, itemId))
      .orderBy(asc(annotations.createdAt), asc(annotations.id))
      .all();
    return rows.map(mapAnnotation);
  }

  update(id: string, input: UpdateAnnotationInput): Annotation | null {
    const patch: Partial<typeof annotations.$inferInsert> = { updatedAt: nowIso() };
    if (input.note !== undefined) patch.note = input.note;
    if (input.color !== undefined) patch.color = input.color;
    const row = this.db
      .update(annotations)
      .set(patch)
      .where(eq(annotations.id, id))
      .returning()
      .get();
    return row ? mapAnnotation(row) : null;
  }

  /** Delete an annotation. Returns true if a row was removed. */
  delete(id: string): boolean {
    return this.db.delete(annotations).where(eq(annotations.id, id)).returning().all().length > 0;
  }

  countByItem(itemId: string): number {
    return this.db.select().from(annotations).where(eq(annotations.itemId, itemId)).all().length;
  }
}
