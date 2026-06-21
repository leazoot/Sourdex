import { extractDomain, normalizeUrl, type Logger, type Storage } from "@sourdex/core";
import {
  computeSourceHash,
  type CaptureRepository,
  type ItemRepository,
  type JobRepository,
  type SearchRepository,
} from "@sourdex/db";

/** Request to capture a webpage (PRD §13.1). */
export interface CaptureWebpageInput {
  url: string;
  title: string;
  html: string;
  selectedText?: string;
  faviconUrl?: string;
  capturedAt?: string;
  /** Force creating a new item even if a duplicate exists (OQ-R1). */
  forceNew?: boolean;
}

/** Capture result (PRD §13.1 response). `exists` means a duplicate was found. */
export interface CaptureWebpageResult {
  itemId: string;
  status: "saved" | "exists";
  jobIds: string[];
}

export interface CaptureServiceDeps {
  itemRepo: ItemRepository;
  captureRepo: CaptureRepository;
  jobRepo: JobRepository;
  searchRepo: SearchRepository;
  storage: Storage;
  logger?: Logger;
}

function safeDomain(url: string): string | null {
  try {
    return extractDomain(url);
  } catch {
    return null;
  }
}

function safeNormalize(url: string): string | null {
  try {
    return normalizeUrl(url);
  } catch {
    return null;
  }
}

/**
 * Orchestrates saving a webpage. Persists the item + raw capture first and returns
 * immediately (save-first, OQ-A2 / PRD §18.1); extraction runs later as a background
 * job. Extraction/AI failures never block a successful save (PRD §5.1.1, §14.1).
 */
export class CaptureService {
  constructor(private readonly deps: CaptureServiceDeps) {}

  async captureWebpage(input: CaptureWebpageInput): Promise<CaptureWebpageResult> {
    const { itemRepo, captureRepo, jobRepo, searchRepo, storage, logger } = this.deps;

    const domain = safeDomain(input.url);
    const canonicalUrl = safeNormalize(input.url);
    const sourceHash = computeSourceHash({ canonicalUrl: input.url });

    if (!input.forceNew) {
      const existing = itemRepo.findBySourceHash(sourceHash);
      if (existing) {
        return { itemId: existing.id, status: "exists", jobIds: [] };
      }
    }

    const item = itemRepo.create({
      type: "webpage",
      title: input.title.trim() || domain || input.url,
      url: input.url,
      canonicalUrl,
      domain,
      sourceHash,
    });

    let rawHtmlPath: string | null = null;
    try {
      rawHtmlPath = await storage.write(`files/raw-html/${item.id}.html`, input.html);
    } catch (error) {
      logger?.warn("failed to store raw html", { itemId: item.id });
      void error;
    }

    let originalTextPath: string | null = null;
    if (input.selectedText) {
      try {
        originalTextPath = await storage.write(`files/text/${item.id}.txt`, input.selectedText);
      } catch (error) {
        logger?.warn("failed to store selected text", { itemId: item.id });
        void error;
      }
    }

    captureRepo.create({
      itemId: item.id,
      rawHtmlPath,
      originalTextPath,
      extractionStatus: "pending",
    });

    // Index title (+ selection) immediately so the item is findable before extraction.
    searchRepo.index({
      itemId: item.id,
      title: item.title,
      plainText: input.selectedText ?? "",
      summary: null,
      tags: null,
    });

    const job = jobRepo.create({ type: "extract_content", payload: { itemId: item.id } });

    return { itemId: item.id, status: "saved", jobIds: [job.id] };
  }
}
