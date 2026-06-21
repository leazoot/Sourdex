import type { Tag, TagWithCount } from "@sourdex/core";
import { NotFoundError, ValidationError } from "@sourdex/core";
import { reindexItem, type ReindexDeps } from "./reindex-item.js";

export type TagServiceDeps = ReindexDeps;

export interface RenameResult {
  tag: Tag;
  /** True when the rename collided with an existing tag and was resolved as a merge. */
  merged: boolean;
}

/**
 * Tag management for the Tags page (PRD §6.2): list with counts, rename, merge, delete.
 * Tag names live in the FTS index, so every change rebuilds the affected items' FTS rows
 * via the shared {@link reindexItem} helper to keep search consistent (PRD §15.2).
 */
export class TagService {
  constructor(private readonly deps: TagServiceDeps) {}

  list(): TagWithCount[] {
    return this.deps.tagRepo.listAllWithCounts();
  }

  /** Rename a tag. Renaming onto an existing tag's name merges into it instead. */
  async rename(id: string, name: string): Promise<RenameResult> {
    const trimmed = name.trim();
    if (!trimmed) throw new ValidationError("Tag name cannot be empty");
    const { tagRepo } = this.deps;
    if (!tagRepo.findById(id)) throw new NotFoundError(`Tag not found: ${id}`);

    const collision = tagRepo.findByNormalizedName(trimmed);
    if (collision && collision.id !== id) {
      const tag = await this.merge(id, collision.id);
      return { tag, merged: true };
    }

    const renamed = tagRepo.rename(id, trimmed);
    if (!renamed) throw new NotFoundError(`Tag not found: ${id}`);
    await this.reindexAll(tagRepo.itemIdsForTag(id));
    return { tag: renamed, merged: false };
  }

  /** Merge `sourceId` into `targetId`; the source tag is removed. */
  async merge(sourceId: string, targetId: string): Promise<Tag> {
    if (sourceId === targetId) throw new ValidationError("Cannot merge a tag into itself");
    const { tagRepo } = this.deps;
    const target = tagRepo.findById(targetId);
    if (!target) throw new NotFoundError(`Target tag not found: ${targetId}`);
    if (!tagRepo.findById(sourceId)) throw new NotFoundError(`Source tag not found: ${sourceId}`);
    const affected = tagRepo.mergeInto(sourceId, targetId);
    await this.reindexAll(affected);
    return target;
  }

  async delete(id: string): Promise<void> {
    const { tagRepo } = this.deps;
    if (!tagRepo.findById(id)) throw new NotFoundError(`Tag not found: ${id}`);
    const affected = tagRepo.deleteTag(id);
    await this.reindexAll(affected);
  }

  private async reindexAll(itemIds: string[]): Promise<void> {
    for (const itemId of itemIds) {
      await reindexItem(itemId, this.deps);
    }
  }
}
