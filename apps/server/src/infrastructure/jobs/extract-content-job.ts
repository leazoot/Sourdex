import { ExtractionError, type ExtractResult, type Logger, type Storage } from "@sourdex/core";
import type {
  CaptureRepository,
  ItemRepository,
  SearchRepository,
  TagRepository,
} from "@sourdex/db";
import type { ContentExtractor } from "@sourdex/core";
import type { JobHandler } from "./job-worker.js";

export interface ExtractContentJobDeps {
  itemRepo: ItemRepository;
  captureRepo: CaptureRepository;
  tagRepo: TagRepository;
  searchRepo: SearchRepository;
  storage: Storage;
  extractor: ContentExtractor;
  logger?: Logger;
}

/**
 * Build the `extract_content` job handler (PRD §10.5, §26.1).
 *
 * Reads the stored raw HTML, runs extraction, and persists readable HTML / Markdown /
 * plain text, updating the item and FTS index. On extraction failure it falls back to
 * the saved selection; if that is unavailable it marks the capture failed but keeps the
 * raw HTML so the item stays usable. Extraction failure does NOT throw (no retry storm);
 * only unexpected infrastructure errors propagate to trigger a retry.
 */
export function createExtractContentJob(deps: ExtractContentJobDeps): JobHandler {
  const { itemRepo, captureRepo, tagRepo, searchRepo, storage, extractor, logger } = deps;

  return async (job) => {
    const payload = JSON.parse(job.payload) as { itemId?: string };
    const itemId = payload.itemId;
    if (!itemId) throw new Error("extract_content payload missing itemId");

    const item = itemRepo.findById(itemId);
    const capture = captureRepo.findByItemId(itemId);
    if (!item || !capture) return;

    let html: string | null = null;
    if (capture.rawHtmlPath) {
      try {
        html = await storage.readText(capture.rawHtmlPath);
      } catch {
        html = null;
      }
    }

    let selectedText: string | null = null;
    if (capture.originalTextPath) {
      try {
        selectedText = await storage.readText(capture.originalTextPath);
      } catch {
        selectedText = null;
      }
    }

    const persist = async (result: ExtractResult): Promise<void> => {
      const markdownPath = await storage.write(`files/markdown/${itemId}.md`, result.markdown);
      const readableHtmlPath = await storage.write(
        `files/readable-html/${itemId}.html`,
        result.readableHtml ?? "",
      );
      const textPath = await storage.write(`files/text/${itemId}.txt`, result.plainText);

      captureRepo.updateExtraction(capture.id, {
        markdownPath,
        readableHtmlPath,
        originalTextPath: textPath,
        extractionStatus: "success",
      });
      itemRepo.applyExtraction(itemId, {
        author: result.author,
        wordCount: result.wordCount,
        readingTime: result.readingTime,
      });

      const tags = tagRepo
        .listByItem(itemId)
        .map((t) => t.name)
        .join(" ");
      // Keep a saved selection searchable even if extraction's body doesn't contain it
      // (e.g. text selected from nav/aside that Readability strips). PRD §15.2.
      const selection = selectedText?.trim();
      const plainText =
        selection && !result.plainText.includes(selection)
          ? `${result.plainText}\n${selection}`
          : result.plainText;
      searchRepo.index({
        itemId,
        title: result.title || item.title,
        plainText,
        summary: item.summary,
        tags,
      });
    };

    try {
      const result = await extractor.extract({
        sourceType: item.type,
        url: item.url,
        title: item.title,
        html,
        selectedText,
      });
      await persist(result);
    } catch (error) {
      if (!(error instanceof ExtractionError)) throw error; // infra error → retry

      if (selectedText && selectedText.trim()) {
        try {
          const fallback = await extractor.extract({
            sourceType: "selection",
            url: item.url,
            title: item.title,
            selectedText,
          });
          await persist(fallback);
          return;
        } catch {
          // fall through to mark failed
        }
      }

      captureRepo.updateExtraction(capture.id, {
        extractionStatus: "failed",
        extractionError: error.message,
      });
      logger?.warn("extraction failed; raw html retained", { itemId });
    }
  };
}
