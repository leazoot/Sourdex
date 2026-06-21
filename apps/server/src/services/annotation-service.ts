import type { Annotation, Logger, Storage } from "@sourdex/core";
import { NotFoundError } from "@sourdex/core";
import type {
  AnnotationRepository,
  CaptureRepository,
  CreateAnnotationInput,
  ItemRepository,
  SearchRepository,
  TagRepository,
  UpdateAnnotationInput,
} from "@sourdex/db";

export interface AnnotationServiceDeps {
  annotationRepo: AnnotationRepository;
  itemRepo: ItemRepository;
  captureRepo: CaptureRepository;
  tagRepo: TagRepository;
  searchRepo: SearchRepository;
  storage: Storage;
  logger?: Logger;
}

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
    await this.reindex(itemId);
    return annotation;
  }

  async update(id: string, input: UpdateAnnotationInput): Promise<Annotation> {
    const updated = this.deps.annotationRepo.update(id, input);
    if (!updated) throw new NotFoundError(`Annotation not found: ${id}`);
    await this.reindex(updated.itemId);
    return updated;
  }

  async delete(id: string): Promise<void> {
    const existing = this.deps.annotationRepo.findById(id);
    if (!existing) throw new NotFoundError(`Annotation not found: ${id}`);
    this.deps.annotationRepo.delete(id);
    await this.reindex(existing.itemId);
  }

  /** Rebuild the item's FTS row so note/highlight text is searchable (PRD §15.2). */
  private async reindex(itemId: string): Promise<void> {
    const { itemRepo, captureRepo, tagRepo, annotationRepo, searchRepo, storage, logger } =
      this.deps;
    const item = itemRepo.findById(itemId);
    if (!item) return;

    let plainText = "";
    const capture = captureRepo.findByItemId(itemId);
    if (capture?.originalTextPath) {
      try {
        plainText = await storage.readText(capture.originalTextPath);
      } catch {
        plainText = "";
      }
    }
    const tags = tagRepo
      .listByItem(itemId)
      .map((t) => t.name)
      .join(" ");
    const annotations = annotationRepo
      .listByItem(itemId)
      .map((a) => [a.selectedText, a.note].filter(Boolean).join(" "))
      .join(" ");

    try {
      searchRepo.index({
        itemId,
        title: item.title,
        plainText,
        summary: item.summary,
        tags,
        annotations,
      });
    } catch (error) {
      logger?.warn("annotation reindex failed", { itemId, error: (error as Error).message });
    }
  }
}
