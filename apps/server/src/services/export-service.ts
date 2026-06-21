import { createId, type ExportFailure, type ExportInput, type ExportResult } from "@sourdex/core";
import type { Storage } from "@sourdex/core";
import type {
  AnnotationRepository,
  CaptureRepository,
  ItemRepository,
  TagRepository,
} from "@sourdex/db";
import { safeFilename, toMarkdownDocument, uniqueFilename } from "@sourdex/exporter";
import { strToU8, zipSync } from "fflate";

export interface ExportServiceDeps {
  itemRepo: ItemRepository;
  captureRepo: CaptureRepository;
  tagRepo: TagRepository;
  annotationRepo: AnnotationRepository;
  storage: Storage;
}

interface BuiltDoc {
  domain: string | null;
  filename: string;
  markdown: string;
}

/**
 * Builds Markdown exports (PRD §5.1.7 / §13.5). Single item → one `.md`; multiple → a zip.
 * Missing items are skipped and reported (OQ-R2) rather than failing the whole export.
 * Obsidian format groups notes into per-domain folders for a clean vault structure.
 */
export class ExportService {
  constructor(private readonly deps: ExportServiceDeps) {}

  async export(input: ExportInput): Promise<ExportResult> {
    const exportId = createId("export");
    const docs: BuiltDoc[] = [];
    const failed: ExportFailure[] = [];

    for (const id of input.itemIds) {
      const item = this.deps.itemRepo.findById(id);
      if (!item || item.status === "deleted") {
        failed.push({ itemId: id, reason: "not_found" });
        continue;
      }
      const capture = this.deps.captureRepo.findByItemId(id);
      let content: string | null = null;
      if (capture?.markdownPath) {
        try {
          content = await this.deps.storage.readText(capture.markdownPath);
        } catch {
          content = null; // extraction artifact missing — export metadata-only, not a failure
        }
      }
      const tags = this.deps.tagRepo.listByItem(id);
      const annotations = this.deps.annotationRepo.listByItem(id);
      docs.push({
        domain: item.domain,
        filename: safeFilename(item.title),
        markdown: toMarkdownDocument({ item, tags, content, annotations, format: input.format }),
      });
    }

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
}
