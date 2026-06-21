import {
  createId,
  nowIso,
  type Tag,
  type TagSource,
  type TagType,
  type TagWithCount,
} from "@sourdex/core";
import { and, asc, desc, eq, ne, sql } from "drizzle-orm";
import type { Db } from "../client.js";
import { items, itemTags, tags } from "../schema.js";
import { mapTag } from "../mappers.js";

/** Normalize a tag name for matching/dedup (lowercase, trimmed, collapsed whitespace). */
export function normalizeTagName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, " ");
}

/** Data access for tags and item↔tag associations (PRD §10.1). */
export class TagRepository {
  constructor(private readonly db: Db) {}

  /** Look up a tag by normalized name without creating it (null if absent). */
  findByNormalizedName(name: string): Tag | null {
    const normalized = normalizeTagName(name);
    const row = this.db.select().from(tags).where(eq(tags.normalizedName, normalized)).get();
    return row ? mapTag(row) : null;
  }

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

  findById(id: string): Tag | null {
    const row = this.db.select().from(tags).where(eq(tags.id, id)).get();
    return row ? mapTag(row) : null;
  }

  /** All tags with the number of non-deleted items referencing each (Tags page, PRD §6.2). */
  listAllWithCounts(): TagWithCount[] {
    const rows = this.db
      .select({ tag: tags, count: sql<number>`count(${items.id})` })
      .from(tags)
      .leftJoin(itemTags, eq(itemTags.tagId, tags.id))
      .leftJoin(items, and(eq(items.id, itemTags.itemId), ne(items.status, "deleted")))
      .groupBy(tags.id)
      .orderBy(desc(sql`count(${items.id})`), asc(tags.normalizedName))
      .all();
    return rows.map((row) => ({ ...mapTag(row.tag), count: Number(row.count) }));
  }

  /** Item ids associated with a tag (used to rebuild FTS after a tag change). */
  itemIdsForTag(tagId: string): string[] {
    return this.db
      .select({ id: itemTags.itemId })
      .from(itemTags)
      .where(eq(itemTags.tagId, tagId))
      .all()
      .map((row) => row.id);
  }

  /** Rename a tag (name + normalized name). Returns null if the tag is gone. */
  rename(id: string, name: string): Tag | null {
    const row = this.db
      .update(tags)
      .set({ name: name.trim(), normalizedName: normalizeTagName(name) })
      .where(eq(tags.id, id))
      .returning()
      .get();
    return row ? mapTag(row) : null;
  }

  /**
   * Merge `sourceId` into `targetId`: re-point every association (preserving source/confidence,
   * skipping duplicates the item already has on the target), then drop the source tag.
   * Returns the affected item ids so the caller can rebuild their FTS rows.
   */
  mergeInto(sourceId: string, targetId: string): string[] {
    return this.db.transaction((tx) => {
      const srcRows = tx.select().from(itemTags).where(eq(itemTags.tagId, sourceId)).all();
      for (const row of srcRows) {
        tx.insert(itemTags)
          .values({
            itemId: row.itemId,
            tagId: targetId,
            confidence: row.confidence,
            source: row.source,
          })
          .onConflictDoNothing()
          .run();
      }
      tx.delete(itemTags).where(eq(itemTags.tagId, sourceId)).run();
      tx.delete(tags).where(eq(tags.id, sourceId)).run();
      return srcRows.map((row) => row.itemId);
    });
  }

  /** Delete a tag and its associations. Returns affected item ids for FTS rebuild. */
  deleteTag(id: string): string[] {
    return this.db.transaction((tx) => {
      const affected = tx
        .select({ id: itemTags.itemId })
        .from(itemTags)
        .where(eq(itemTags.tagId, id))
        .all()
        .map((row) => row.id);
      tx.delete(itemTags).where(eq(itemTags.tagId, id)).run();
      tx.delete(tags).where(eq(tags.id, id)).run();
      return affected;
    });
  }
}
