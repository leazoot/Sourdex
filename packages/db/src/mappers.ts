/** Map database rows (snake_case columns, nullable defaults) to core domain DTOs. */
import type { Capture, Item, Job, ProviderConfig, Tag } from "@sourdex/core";
import type { CaptureRow, ItemRow, JobRow, ProviderConfigRow, TagRow } from "./schema.js";

export function mapItem(row: ItemRow): Item {
  return {
    id: row.id,
    type: row.type,
    status: row.status,
    title: row.title,
    url: row.url,
    canonicalUrl: row.canonicalUrl,
    domain: row.domain,
    author: row.author,
    publishedAt: row.publishedAt,
    savedAt: row.savedAt,
    updatedAt: row.updatedAt,
    summary: row.summary,
    oneSentence: row.oneSentence,
    thumbnailPath: row.thumbnailPath,
    sourceHash: row.sourceHash,
    wordCount: row.wordCount ?? 0,
    readingTime: row.readingTime ?? 0,
    aiStatus: row.aiStatus ?? "none",
  };
}

export function mapCapture(row: CaptureRow): Capture {
  return {
    id: row.id,
    itemId: row.itemId,
    rawHtmlPath: row.rawHtmlPath,
    readableHtmlPath: row.readableHtmlPath,
    markdownPath: row.markdownPath,
    screenshotPath: row.screenshotPath,
    originalTextPath: row.originalTextPath,
    extractionStatus: row.extractionStatus,
    extractionError: row.extractionError,
    createdAt: row.createdAt,
  };
}

export function mapTag(row: TagRow): Tag {
  return {
    id: row.id,
    name: row.name,
    normalizedName: row.normalizedName,
    type: row.type,
    createdAt: row.createdAt,
  };
}

export function mapJob(row: JobRow): Job {
  return {
    id: row.id,
    type: row.type,
    payload: row.payload,
    status: row.status,
    attempts: row.attempts,
    maxAttempts: row.maxAttempts,
    error: row.error,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    startedAt: row.startedAt,
    completedAt: row.completedAt,
  };
}

export function mapProviderConfig(row: ProviderConfigRow): ProviderConfig {
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    baseUrl: row.baseUrl,
    chatModel: row.chatModel,
    embeddingModel: row.embeddingModel,
    enabled: row.enabled,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}
