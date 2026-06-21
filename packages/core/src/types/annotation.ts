/** Annotation domain types. Mirrors PRD §12.6 `annotations`. Highlights & notes (v0.2). */

/** A highlight + optional note on an item (PRD §5.2.5, §12.6). */
export interface Annotation {
  id: string;
  itemId: string;
  chunkId: string | null;
  selectedText: string;
  note: string | null;
  color: string | null;
  /** ISO 8601 string. */
  createdAt: string;
  /** ISO 8601 string. */
  updatedAt: string;
}
