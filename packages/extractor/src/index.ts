/**
 * @sourdex/extractor — webpage content extraction, HTML cleaning, HTML→Markdown and
 * text metrics. Pure: input/output are DTOs from @sourdex/core; no database, no UI
 * (PRD §8.6).
 */
export { createExtractor } from "./extractor.js";
export { WebpageExtractStrategy } from "./strategies/webpage.js";
export { SelectionExtractStrategy } from "./strategies/selection.js";
export { extractDiscourseArticle, isDiscourseDocument } from "./strategies/adapters/discourse.js";
export { extractArticle, type Article } from "./html/readability.js";
export { precleanDocument } from "./html/preclean.js";
export { sanitizeHtml } from "./html/sanitize.js";
export { htmlToMarkdown } from "./markdown/to-markdown.js";
export { normalizeWhitespace, escapeHtml } from "./text/plain-text.js";
export { countWords, readingTimeMinutes } from "./text/metrics.js";
