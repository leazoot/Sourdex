import {
  createId,
  NotFoundError,
  nowIso,
  type CreateItemInput,
  type Item,
  type ItemListQuery,
  type Paginated,
  type UpdateItemInput,
} from "@sourdex/core";
import { and, asc, desc, eq, inArray, like, ne, sql } from "drizzle-orm";
import type { Db } from "../client.js";
import { itemTags, items, tags } from "../schema.js";
import { mapItem } from "../mappers.js";
import { normalizeTagName } from "./tag-repository.js";

const DEFAULT_PAGE_SIZE = 20;

/** Data access for items (PRD §10.1 Repository pattern). */
export class ItemRepository {
  constructor(private readonly db: Db) {}

  create(input: CreateItemInput): Item {
    const now = nowIso();
    const row = this.db
      .insert(items)
      .values({
        id: createId("item"),
        type: input.type,
        status: "inbox",
        title: input.title,
        url: input.url ?? null,
        canonicalUrl: input.canonicalUrl ?? null,
        domain: input.domain ?? null,
        author: input.author ?? null,
        publishedAt: input.publishedAt ?? null,
        savedAt: now,
        updatedAt: now,
        summary: input.summary ?? null,
        oneSentence: input.oneSentence ?? null,
        thumbnailPath: input.thumbnailPath ?? null,
        sourceHash: input.sourceHash ?? null,
        wordCount: input.wordCount ?? 0,
        readingTime: input.readingTime ?? 0,
        aiStatus: "none",
      })
      .returning()
      .get();
    return mapItem(row);
  }

  findById(id: string): Item | null {
    const row = this.db.select().from(items).where(eq(items.id, id)).get();
    return row ? mapItem(row) : null;
  }

  findBySourceHash(sourceHash: string): Item | null {
    const row = this.db
      .select()
      .from(items)
      .where(and(eq(items.sourceHash, sourceHash), ne(items.status, "deleted")))
      .get();
    return row ? mapItem(row) : null;
  }

  list(query: ItemListQuery): Paginated<Item> {
    const page = query.page && query.page > 0 ? query.page : 1;
    const pageSize = query.pageSize && query.pageSize > 0 ? query.pageSize : DEFAULT_PAGE_SIZE;

    const conditions = [
      query.status ? eq(items.status, query.status) : ne(items.status, "deleted"),
    ];
    if (query.type) conditions.push(eq(items.type, query.type));
    if (query.domain) conditions.push(eq(items.domain, query.domain));
    if (query.q) conditions.push(like(items.title, `%${query.q}%`));
    if (query.tag) {
      const tagged = this.db
        .select({ id: itemTags.itemId })
        .from(itemTags)
        .innerJoin(tags, eq(itemTags.tagId, tags.id))
        .where(eq(tags.normalizedName, normalizeTagName(query.tag)));
      conditions.push(inArray(items.id, tagged));
    }
    const where = and(...conditions);

    const orderBy =
      query.sort === "oldest"
        ? asc(items.savedAt)
        : query.sort === "title"
          ? asc(items.title)
          : desc(items.savedAt);

    const totalRow = this.db
      .select({ count: sql<number>`count(*)` })
      .from(items)
      .where(where)
      .get();
    const total = totalRow?.count ?? 0;

    const rows = this.db
      .select()
      .from(items)
      .where(where)
      .orderBy(orderBy)
      .limit(pageSize)
      .offset((page - 1) * pageSize)
      .all();

    return { items: rows.map(mapItem), page, pageSize, total };
  }

  update(id: string, input: UpdateItemInput): Item {
    const patch: Partial<typeof items.$inferInsert> = { updatedAt: nowIso() };
    if (input.title !== undefined) patch.title = input.title;
    if (input.status !== undefined) patch.status = input.status;
    if (input.summary !== undefined) patch.summary = input.summary;
    if (input.oneSentence !== undefined) patch.oneSentence = input.oneSentence;

    const row = this.db.update(items).set(patch).where(eq(items.id, id)).returning().get();
    if (!row) throw new NotFoundError(`Item not found: ${id}`);
    return mapItem(row);
  }

  /** Apply extraction-derived metadata (not user-patchable; set by the extract job). */
  applyExtraction(
    id: string,
    input: { author?: string | null; wordCount: number; readingTime: number },
  ): Item {
    const patch: Partial<typeof items.$inferInsert> = {
      updatedAt: nowIso(),
      wordCount: input.wordCount,
      readingTime: input.readingTime,
    };
    if (input.author !== undefined) patch.author = input.author;

    const row = this.db.update(items).set(patch).where(eq(items.id, id)).returning().get();
    if (!row) throw new NotFoundError(`Item not found: ${id}`);
    return mapItem(row);
  }

  /** Soft delete (PRD §13.2) — sets status to `deleted`; files are never removed. */
  softDelete(id: string): void {
    const row = this.db
      .update(items)
      .set({ status: "deleted", updatedAt: nowIso() })
      .where(eq(items.id, id))
      .returning({ id: items.id })
      .get();
    if (!row) throw new NotFoundError(`Item not found: ${id}`);
  }
}
