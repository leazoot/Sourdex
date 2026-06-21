/**
 * Drizzle schema for Sourdex SQLite. Column names mirror PRD §12 exactly (snake_case);
 * enum columns are bound to `@sourdex/core` domain types via `$type`.
 *
 * The authoritative DDL applied at runtime lives in `./migrations` (it also creates the
 * FTS5 virtual table, which Drizzle cannot model). This file is used for typed queries.
 */
import { integer, primaryKey, real, sqliteTable, text } from "drizzle-orm/sqlite-core";
import type {
  AiOutputType,
  AiStatus,
  ExtractionStatus,
  ItemStatus,
  JobStatus,
  JobType,
  ProviderType,
  SourceType,
  TagSource,
  TagType,
} from "@sourdex/core";

/** PRD §12.1 */
export const items = sqliteTable("items", {
  id: text("id").primaryKey(),
  type: text("type").$type<SourceType>().notNull(),
  status: text("status").$type<ItemStatus>().notNull().default("inbox"),
  title: text("title").notNull(),
  url: text("url"),
  canonicalUrl: text("canonical_url"),
  domain: text("domain"),
  author: text("author"),
  publishedAt: text("published_at"),
  savedAt: text("saved_at").notNull(),
  updatedAt: text("updated_at").notNull(),
  summary: text("summary"),
  oneSentence: text("one_sentence"),
  thumbnailPath: text("thumbnail_path"),
  sourceHash: text("source_hash"),
  wordCount: integer("word_count").default(0),
  readingTime: integer("reading_time").default(0),
  aiStatus: text("ai_status").$type<AiStatus>().default("none"),
});

/** PRD §12.2 */
export const captures = sqliteTable("captures", {
  id: text("id").primaryKey(),
  itemId: text("item_id")
    .notNull()
    .references(() => items.id),
  rawHtmlPath: text("raw_html_path"),
  readableHtmlPath: text("readable_html_path"),
  markdownPath: text("markdown_path"),
  screenshotPath: text("screenshot_path"),
  originalTextPath: text("original_text_path"),
  extractionStatus: text("extraction_status").$type<ExtractionStatus>().notNull(),
  extractionError: text("extraction_error"),
  createdAt: text("created_at").notNull(),
});

/** PRD §12.3 (enabled in v0.2) */
export const chunks = sqliteTable("chunks", {
  id: text("id").primaryKey(),
  itemId: text("item_id")
    .notNull()
    .references(() => items.id),
  chunkIndex: integer("chunk_index").notNull(),
  text: text("text").notNull(),
  heading: text("heading"),
  startOffset: integer("start_offset"),
  endOffset: integer("end_offset"),
  tokenCount: integer("token_count").default(0),
  createdAt: text("created_at").notNull(),
});

/** PRD §12.4 */
export const tags = sqliteTable("tags", {
  id: text("id").primaryKey(),
  name: text("name").notNull().unique(),
  normalizedName: text("normalized_name").notNull(),
  type: text("type").$type<TagType>().notNull().default("manual"),
  createdAt: text("created_at").notNull(),
});

/** PRD §12.5 */
export const itemTags = sqliteTable(
  "item_tags",
  {
    itemId: text("item_id")
      .notNull()
      .references(() => items.id),
    tagId: text("tag_id")
      .notNull()
      .references(() => tags.id),
    confidence: real("confidence"),
    source: text("source").$type<TagSource>().notNull().default("manual"),
  },
  (table) => [primaryKey({ columns: [table.itemId, table.tagId] })],
);

/** PRD §12.6 (enabled in v0.2) */
export const annotations = sqliteTable("annotations", {
  id: text("id").primaryKey(),
  itemId: text("item_id")
    .notNull()
    .references(() => items.id),
  chunkId: text("chunk_id").references(() => chunks.id),
  selectedText: text("selected_text").notNull(),
  note: text("note"),
  color: text("color"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

/** PRD §12.7 */
export const jobs = sqliteTable("jobs", {
  id: text("id").primaryKey(),
  type: text("type").$type<JobType>().notNull(),
  payload: text("payload").notNull(),
  status: text("status").$type<JobStatus>().notNull().default("pending"),
  attempts: integer("attempts").notNull().default(0),
  maxAttempts: integer("max_attempts").notNull().default(3),
  error: text("error"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
  startedAt: text("started_at"),
  completedAt: text("completed_at"),
});

/** PRD §12.8 (enabled in v0.2) */
export const aiOutputs = sqliteTable("ai_outputs", {
  id: text("id").primaryKey(),
  itemId: text("item_id").references(() => items.id),
  type: text("type").$type<AiOutputType>().notNull(),
  provider: text("provider").notNull(),
  model: text("model").notNull(),
  inputHash: text("input_hash").notNull(),
  output: text("output").notNull(),
  createdAt: text("created_at").notNull(),
});

/** PRD §12.9 (enabled in v0.2) — never stores plaintext API keys (PRD §17.2). */
export const providerConfigs = sqliteTable("provider_configs", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").$type<ProviderType>().notNull(),
  baseUrl: text("base_url"),
  chatModel: text("chat_model"),
  embeddingModel: text("embedding_model"),
  enabled: integer("enabled", { mode: "boolean" }).notNull().default(false),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export type ItemRow = typeof items.$inferSelect;
export type CaptureRow = typeof captures.$inferSelect;
export type TagRow = typeof tags.$inferSelect;
export type JobRow = typeof jobs.$inferSelect;
