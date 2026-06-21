import type { Annotation } from "@sourdex/core";
import { NotFoundError } from "@sourdex/core";
import type { CreateAnnotationInput, UpdateAnnotationInput } from "@sourdex/db";
import { reindexItem, type ReindexDeps } from "./reindex-item.js";

export type AnnotationServiceDeps = ReindexDeps;

/**
 * Highlights & notes (PRD §5.2.5, §12.6). Annotations are stored separately from the
 * original content, so highlighting never alters the source (acceptance §5.2.5.1). When
 * annotations change, the item is re-indexed so notes become searchable (PRD §15.2,
 * §5.2.5.4) — the note text is folded into the FTS summary field (OQ-A11).
 */
export class AnnotationService {
  constructor(private readonly deps: AnnotationServiceDeps) {}

  listByItem(itemId: string): Annotation[] {
    return this.deps.annotationRepo.listByItem(itemId);
  }

  async create(itemId: string, input: Omit<CreateAnnotationInput, "itemId">): Promise<Annotation> {
    if (!this.deps.itemRepo.findById(itemId)) throw new NotFoundError(`Item not found: ${itemId}`);
    const annotation = this.deps.annotationRepo.create({ ...input, itemId });
    await reindexItem(itemId, this.deps);
    return annotation;
  }

  async update(id: string, input: UpdateAnnotationInput): Promise<Annotation> {
    const updated = this.deps.annotationRepo.update(id, input);
    if (!updated) throw new NotFoundError(`Annotation not found: ${id}`);
    await reindexItem(updated.itemId, this.deps);
    return updated;
  }

  async delete(id: string): Promise<void> {
    const existing = this.deps.annotationRepo.findById(id);
    if (!existing) throw new NotFoundError(`Annotation not found: ${id}`);
    this.deps.annotationRepo.delete(id);
    await reindexItem(existing.itemId, this.deps);
  }
}
