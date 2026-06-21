import {
  createId,
  type ExportFailure,
  type ExportInput,
  type ExportResult,
  type ExportScope,
  type ItemListQuery,
  type Storage,
} from "@sourdex/core";
import type {
  AnnotationRepository,
  CaptureRepository,
  ItemRepository,
  TagRepository,
} from "@sourdex/db";
import {
  safeFilename,
  toCsvExport,
  toJsonExport,
  toMarkdownDocument,
  uniqueFilename,
  type StructuredExportRecord,
} from "@sourdex/exporter";
import { strToU8, zipSync } from "fflate";

export interface ExportServiceDeps {
  itemRepo: ItemRepository;
  captureRepo: CaptureRepository;
  tagRepo: TagRepository;
  annotationRepo: AnnotationRepository;
  storage: Storage;
}

const SCOPE_PAGE_SIZE = 500;

/**
 * Builds exports (PRD §8.9 / §13.5). Markdown: single item → one `.md`, multiple → a zip
 * (Obsidian groups notes into per-domain folders). JSON/CSV: one structured file regardless
 * of count. Items come from an explicit `itemIds` list or a resolved `scope` (Export page).
 * Missing/deleted items are skipped and reported (OQ-R2) rather than failing the export.
 */
export class ExportService {
  constructor(private readonly deps: ExportServiceDeps) {}

  async export(input: ExportInput): Promise<ExportResult> {
    const exportId = createId("export");
    const ids = input.scope ? this.resolveScope(input.scope) : (input.itemIds ?? []);
    const failed: ExportFailure[] = [];
    const records: StructuredExportRecord[] = [];

    for (const id of ids) {
      const item = this.deps.itemRepo.findById(id);
      if (!item || item.status === "deleted") {
        failed.push({ itemId: id, reason: "not_found" });
        continue;
      }
      let content: string | null = null;
      const capture = this.deps.captureRepo.findByItemId(id);
      if (capture?.markdownPath) {
        try {
          content = await this.deps.storage.readText(capture.markdownPath);
        } catch {
          content = null; // extraction artifact missing — export metadata-only, not a failure
        }
      }
      records.push({
        item,
        content,
        tags: this.deps.tagRepo.listByItem(id),
        annotations: this.deps.annotationRepo.listByItem(id),
      });
    }

    if (input.format === "json") {
      const path = `files/exports/${exportId}/sourdex-export.json`;
      await this.deps.storage.write(path, toJsonExport(records));
      return { exportId, path, count: records.length, failed };
    }
    if (input.format === "csv") {
      const path = `files/exports/${exportId}/sourdex-export.csv`;
      await this.deps.storage.write(path, toCsvExport(records));
      return { exportId, path, count: records.length, failed };
    }

    const docs = records.map((r) => ({
      domain: r.item.domain,
      filename: safeFilename(r.item.title),
      markdown: toMarkdownDocument({
        item: r.item,
        tags: r.tags,
        content: r.content,
        annotations: r.annotations,
        format: input.format,
      }),
    }));

    if (docs.length === 1) {
      const doc = docs[0]!;
      const path = `files/exports/${exportId}/${doc.filename}`;
      await this.deps.storage.write(path, doc.markdown);
      return { exportId, path, count: 1, failed };
    }

    const files: Record<string, Uint8Array> = {};
    const taken = new Set<string>();
    for (const doc of docs) {
      const folder =
        input.format === "obsidian" && doc.domain ? `${safeFilename(doc.domain, "")}/` : "";
      files[uniqueFilename(`${folder}${doc.filename}`, taken)] = strToU8(doc.markdown);
    }
    const path = `files/exports/${exportId}/sourdex-export.zip`;
    await this.deps.storage.write(path, zipSync(files));
    return { exportId, path, count: docs.length, failed };
  }

  /** Resolve an export scope (all / status / tag) to concrete item ids (Export page, PRD §6.2). */
  private resolveScope(scope: ExportScope): string[] {
    const query: ItemListQuery = { pageSize: SCOPE_PAGE_SIZE };
    if (scope.type === "status") query.status = scope.status;
    if (scope.type === "tag") {
      const tag = this.deps.tagRepo.findById(scope.tagId);
      if (!tag) return [];
      query.tag = tag.normalizedName;
    }

    const ids: string[] = [];
    let page = 1;
    for (;;) {
      const res = this.deps.itemRepo.list({ ...query, page });
      ids.push(...res.items.map((item) => item.id));
      if (res.items.length === 0 || page * res.pageSize >= res.total) break;
      page += 1;
    }
    return ids;
  }
}
