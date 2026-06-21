/** Content extraction contract (PRD §9.3, §10.3). Implemented in packages/extractor. */

import type { SourceType } from "../types/item.js";

/** Input to an extraction run. Raw artifacts come from the capture. */
export interface ExtractInput {
  sourceType: SourceType;
  url: string | null;
  title?: string | null;
  html?: string | null;
  selectedText?: string | null;
}

/** Result of an extraction run. Pure DTO — must not depend on any database. */
export interface ExtractResult {
  title: string;
  author: string | null;
  excerpt: string | null;
  markdown: string;
  plainText: string;
  readableHtml: string | null;
  wordCount: number;
  readingTime: number;
}

/** Extractor facade used by services. */
export interface ContentExtractor {
  extract(input: ExtractInput): Promise<ExtractResult>;
}

/** Per-source-type extraction strategy (Strategy pattern, PRD §10.3). */
export interface ExtractStrategy {
  readonly sourceType: SourceType;
  extract(input: ExtractInput): Promise<ExtractResult>;
}
