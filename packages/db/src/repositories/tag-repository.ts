import { createId, nowIso, type Tag, type TagSource, type TagType } from "@sourdex/core";
import { and, eq } from "drizzle-orm";
import type { Db } from "../client.js";
import { itemTags, tags } from "../schema.js";
import { mapTag } from "../mappers.js";

/** Normalize a tag name for matching/dedup (lowercase, trimmed, collapsed whitespace). */
export function normalizeTagName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, " ");
}

/** Data access for tags and item↔tag associations (PRD §10.1). */
export class TagRepository {
  constructor(private readonly db: Db) {}

  /** Find an existing tag by normalized name, or create it. */
  upsert(name: string, type: TagType = "manual"): Tag {
    const normalized = normalizeTagName(name);
    const existing = this.db.select().from(tags).where(eq(tags.normalizedName, normalized)).get();
    if (existing) return mapTag(existing);

    const row = this.db
      .insert(tags)
      .values({
        id: createId("tag"),
        name: name.trim(),
        normalizedName: normalized,
        type,
        createdAt: nowIso(),
      })
      .returning()
      .get();
    return mapTag(row);
  }

  /** Associate a tag with an item. Idempotent (ignores duplicates). */
  attachToItem(
    itemId: string,
    tagId: string,
    options: { confidence?: number | null; source?: TagSource } = {},
  ): void {
    this.db
      .insert(itemTags)
      .values({
        itemId,
        tagId,
        confidence: options.confidence ?? null,
        source: options.source ?? "manual",
      })
      .onConflictDoNothing()
      .run();
  }

  detachFromItem(itemId: string, tagId: string): void {
    this.db
      .delete(itemTags)
      .where(and(eq(itemTags.itemId, itemId), eq(itemTags.tagId, tagId)))
      .run();
  }

  listByItem(itemId: string): Tag[] {
    const rows = this.db
      .select({ tag: tags })
      .from(itemTags)
      .innerJoin(tags, eq(itemTags.tagId, tags.id))
      .where(eq(itemTags.itemId, itemId))
      .all();
    return rows.map((row) => mapTag(row.tag));
  }
}
