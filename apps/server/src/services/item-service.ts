import {
  NotFoundError,
  type Capture,
  type Item,
  type ItemListQuery,
  type Paginated,
  type Storage,
  type Tag,
  type UpdateItemInput,
} from "@sourdex/core";
import type {
  CaptureRepository,
  ItemRepository,
  SearchRepository,
  TagRepository,
} from "@sourdex/db";

/** Full item view returned by GET /api/items/:id (PRD §13.2). */
export interface ItemDetail {
  item: Item;
  capture: Capture | null;
  tags: Tag[];
}

/** Readable content returned by GET /api/items/:id/content. */
export interface ItemContent {
  markdown: string | null;
  readableHtml: string | null;
  plainText: string | null;
}

export interface ItemServiceDeps {
  itemRepo: ItemRepository;
  captureRepo: CaptureRepository;
  tagRepo: TagRepository;
  searchRepo: SearchRepository;
  storage: Storage;
}

/** Read/update/delete operations on items (PRD §13.2). */
export class ItemService {
  constructor(private readonly deps: ItemServiceDeps) {}

  list(query: ItemListQuery): Paginated<Item> {
    return this.deps.itemRepo.list(query);
  }

  /** Get an item with its capture and tags. Throws NotFoundError if missing. */
  get(id: string): ItemDetail {
    const item = this.deps.itemRepo.findById(id);
    if (!item) throw new NotFoundError(`Item not found: ${id}`);
    return {
      item,
      capture: this.deps.captureRepo.findByItemId(id),
      tags: this.deps.tagRepo.listByItem(id),
    };
  }

  /** Read the extracted readable content from disk (Reader page). */
  async getContent(id: string): Promise<ItemContent> {
    const item = this.deps.itemRepo.findById(id);
    if (!item) throw new NotFoundError(`Item not found: ${id}`);
    const capture = this.deps.captureRepo.findByItemId(id);
    const read = async (path: string | null | undefined): Promise<string | null> => {
      if (!path) return null;
      try {
        return await this.deps.storage.readText(path);
      } catch {
        return null;
      }
    };
    return {
      markdown: await read(capture?.markdownPath),
      readableHtml: await read(capture?.readableHtmlPath),
      plainText: await read(capture?.originalTextPath),
    };
  }

  update(id: string, input: UpdateItemInput): Item {
    return this.deps.itemRepo.update(id, input);
  }

  /** Soft delete (PRD §13.2). Files are retained; the item is excluded from listings. */
  softDelete(id: string): void {
    this.deps.itemRepo.softDelete(id);
    this.deps.searchRepo.removeFromIndex(id);
  }
}
