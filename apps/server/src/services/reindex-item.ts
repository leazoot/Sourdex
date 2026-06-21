import type { Logger, Storage } from "@sourdex/core";
import type {
  AnnotationRepository,
  CaptureRepository,
  ItemRepository,
  SearchRepository,
  TagRepository,
} from "@sourdex/db";

export interface ReindexDeps {
  itemRepo: ItemRepository;
  captureRepo: CaptureRepository;
  tagRepo: TagRepository;
  annotationRepo: AnnotationRepository;
  searchRepo: SearchRepository;
  storage: Storage;
  logger?: Logger;
}

/**
 * Rebuild a single item's FTS row from item title/summary + extracted plain text + tag names +
 * annotation notes (PRD §15.2). Shared by AnnotationService and TagService so a tag rename/merge/
 * delete keeps the index consistent. Note text is folded into the FTS summary column (OQ-A11).
 */
export async function reindexItem(itemId: string, deps: ReindexDeps): Promise<void> {
  const { itemRepo, captureRepo, tagRepo, annotationRepo, searchRepo, storage, logger } = deps;
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
    logger?.warn("reindex failed", { itemId, error: (error as Error).message });
  }
}
