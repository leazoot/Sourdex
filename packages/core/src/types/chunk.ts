/** Chunk domain types. Mirrors PRD §12.3 `chunks`. Used by semantic search (v0.2). */

/** A text chunk of an item, the unit of embedding and citation (PRD §12.3, §14.6). */
export interface Chunk {
  id: string;
  itemId: string;
  chunkIndex: number;
  text: string;
  heading: string | null;
  startOffset: number | null;
  endOffset: number | null;
  tokenCount: number;
  /** ISO 8601 string. */
  createdAt: string;
}
