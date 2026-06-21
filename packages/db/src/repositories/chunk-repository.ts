import { createId, nowIso, type Chunk } from "@sourdex/core";
import { asc, eq } from "drizzle-orm";
import type { Db } from "../client.js";
import { chunks } from "../schema.js";
import { mapChunk } from "../mappers.js";

/** Fields for one chunk to persist (PRD §12.3). `id`/`createdAt` are generated. */
export interface CreateChunkInput {
  chunkIndex: number;
  text: string;
  heading?: string | null;
  startOffset?: number | null;
  endOffset?: number | null;
  tokenCount?: number;
}

/** Data access for an item's text chunks (PRD §10.1, §12.3). */
export class ChunkRepository {
  constructor(private readonly db: Db) {}

  /** Replace all chunks for an item (idempotent re-chunking, PRD §14.6 rule 5). */
  replaceForItem(itemId: string, inputs: CreateChunkInput[]): Chunk[] {
    return this.db.transaction((tx) => {
      tx.delete(chunks).where(eq(chunks.itemId, itemId)).run();
      if (inputs.length === 0) return [];
      const now = nowIso();
      const rows = tx
        .insert(chunks)
        .values(
          inputs.map((c) => ({
            id: createId("chunk"),
            itemId,
            chunkIndex: c.chunkIndex,
            text: c.text,
            heading: c.heading ?? null,
            startOffset: c.startOffset ?? null,
            endOffset: c.endOffset ?? null,
            tokenCount: c.tokenCount ?? 0,
            createdAt: now,
          })),
        )
        .returning()
        .all();
      return rows.map(mapChunk);
    });
  }

  findById(id: string): Chunk | null {
    const row = this.db.select().from(chunks).where(eq(chunks.id, id)).get();
    return row ? mapChunk(row) : null;
  }

  listByItem(itemId: string): Chunk[] {
    const rows = this.db
      .select()
      .from(chunks)
      .where(eq(chunks.itemId, itemId))
      .orderBy(asc(chunks.chunkIndex))
      .all();
    return rows.map(mapChunk);
  }

  deleteByItem(itemId: string): void {
    this.db.delete(chunks).where(eq(chunks.itemId, itemId)).run();
  }
}
