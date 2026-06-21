/** Tag domain types. Mirrors PRD §12.4 `tags` and §12.5 `item_tags`. */

/** Origin of a tag definition (PRD §12.4 `type`). */
export type TagType = "manual" | "ai";

/** Origin of an item↔tag association (PRD §12.5 `source`). */
export type TagSource = "manual" | "ai";

/** A normalized tag (PRD §12.4). */
export interface Tag {
  id: string;
  name: string;
  normalizedName: string;
  type: TagType;
  /** ISO 8601 string. */
  createdAt: string;
}

/** A tag with how many (non-deleted) items reference it — for the Tags page (PRD §6.2). */
export interface TagWithCount extends Tag {
  count: number;
}

/** Association between an item and a tag (PRD §12.5). */
export interface ItemTag {
  itemId: string;
  tagId: string;
  /** AI confidence in [0,1]; null for manual tags. */
  confidence: number | null;
  source: TagSource;
}

/** Fields accepted when creating a tag. `normalizedName` is derived if omitted. */
export interface CreateTagInput {
  name: string;
  normalizedName?: string;
  type?: TagType;
}
