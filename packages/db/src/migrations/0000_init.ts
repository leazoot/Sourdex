/**
 * Migration 0000 — initial schema.
 *
 * DDL matches PRD §12 exactly. All nine tables are created up front (decision OQ-A5),
 * even though chunks/annotations/ai_outputs/provider_configs are only used from v0.2,
 * to avoid a large migration later. The FTS5 virtual table (PRD §15.2) is created here
 * because Drizzle cannot model virtual tables; it is maintained at the application layer
 * (decision OQ-A3) by SearchRepository.
 */
export const migration0000 = {
  name: "0000_init",
  sql: /* sql */ `
CREATE TABLE IF NOT EXISTS items (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'inbox',
  title TEXT NOT NULL,
  url TEXT,
  canonical_url TEXT,
  domain TEXT,
  author TEXT,
  published_at TEXT,
  saved_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  summary TEXT,
  one_sentence TEXT,
  thumbnail_path TEXT,
  source_hash TEXT,
  word_count INTEGER DEFAULT 0,
  reading_time INTEGER DEFAULT 0,
  ai_status TEXT DEFAULT 'none'
);

CREATE TABLE IF NOT EXISTS captures (
  id TEXT PRIMARY KEY,
  item_id TEXT NOT NULL,
  raw_html_path TEXT,
  readable_html_path TEXT,
  markdown_path TEXT,
  screenshot_path TEXT,
  original_text_path TEXT,
  extraction_status TEXT NOT NULL,
  extraction_error TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (item_id) REFERENCES items(id)
);

CREATE TABLE IF NOT EXISTS chunks (
  id TEXT PRIMARY KEY,
  item_id TEXT NOT NULL,
  chunk_index INTEGER NOT NULL,
  text TEXT NOT NULL,
  heading TEXT,
  start_offset INTEGER,
  end_offset INTEGER,
  token_count INTEGER DEFAULT 0,
  created_at TEXT NOT NULL,
  FOREIGN KEY (item_id) REFERENCES items(id)
);

CREATE TABLE IF NOT EXISTS tags (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  normalized_name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'manual',
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS item_tags (
  item_id TEXT NOT NULL,
  tag_id TEXT NOT NULL,
  confidence REAL,
  source TEXT NOT NULL DEFAULT 'manual',
  PRIMARY KEY (item_id, tag_id),
  FOREIGN KEY (item_id) REFERENCES items(id),
  FOREIGN KEY (tag_id) REFERENCES tags(id)
);

CREATE TABLE IF NOT EXISTS annotations (
  id TEXT PRIMARY KEY,
  item_id TEXT NOT NULL,
  chunk_id TEXT,
  selected_text TEXT NOT NULL,
  note TEXT,
  color TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (item_id) REFERENCES items(id),
  FOREIGN KEY (chunk_id) REFERENCES chunks(id)
);

CREATE TABLE IF NOT EXISTS jobs (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  payload TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  attempts INTEGER NOT NULL DEFAULT 0,
  max_attempts INTEGER NOT NULL DEFAULT 3,
  error TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  started_at TEXT,
  completed_at TEXT
);

CREATE TABLE IF NOT EXISTS ai_outputs (
  id TEXT PRIMARY KEY,
  item_id TEXT,
  type TEXT NOT NULL,
  provider TEXT NOT NULL,
  model TEXT NOT NULL,
  input_hash TEXT NOT NULL,
  output TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (item_id) REFERENCES items(id)
);

CREATE TABLE IF NOT EXISTS provider_configs (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  base_url TEXT,
  chat_model TEXT,
  embedding_model TEXT,
  enabled INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_items_status ON items(status);
CREATE INDEX IF NOT EXISTS idx_items_saved_at ON items(saved_at);
CREATE INDEX IF NOT EXISTS idx_items_domain ON items(domain);
CREATE INDEX IF NOT EXISTS idx_items_source_hash ON items(source_hash);
CREATE INDEX IF NOT EXISTS idx_captures_item_id ON captures(item_id);
CREATE INDEX IF NOT EXISTS idx_chunks_item_id ON chunks(item_id);
CREATE INDEX IF NOT EXISTS idx_item_tags_tag_id ON item_tags(tag_id);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);

-- Full-text index (PRD §15.2). Maintained explicitly by SearchRepository (OQ-A3).
CREATE VIRTUAL TABLE IF NOT EXISTS items_fts USING fts5(
  item_id UNINDEXED,
  title,
  plain_text,
  summary,
  tags,
  tokenize = 'unicode61'
);
`,
};
