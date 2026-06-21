import type { Db } from "./client.js";
import { CaptureRepository } from "./repositories/capture-repository.js";
import { ItemRepository } from "./repositories/item-repository.js";
import { SearchRepository } from "./repositories/search-repository.js";
import { TagRepository } from "./repositories/tag-repository.js";

interface SampleItem {
  title: string;
  url: string;
  domain: string;
  summary: string;
  text: string;
  tag: string;
}

const SAMPLES: SampleItem[] = [
  {
    title: "Understanding SQLite FTS5",
    url: "https://example.com/sqlite-fts5",
    domain: "example.com",
    summary: "A practical guide to full-text search in SQLite.",
    text: "SQLite FTS5 provides fast full text search with ranking and snippets.",
    tag: "sqlite",
  },
  {
    title: "Building Chrome MV3 extensions",
    url: "https://example.com/mv3",
    domain: "example.com",
    summary: "How Manifest V3 changes extension development.",
    text: "Manifest V3 introduces service workers and new permission models for Chrome extensions.",
    tag: "browser-extension",
  },
];

/**
 * Insert a small set of example items for local development (PRD §8.5 seed dev data).
 * For dev/test only — call against a dev database, never a user's production data dir.
 */
export function seedDevData(db: Db): { itemIds: string[] } {
  const items = new ItemRepository(db);
  const captures = new CaptureRepository(db);
  const tags = new TagRepository(db);
  const search = new SearchRepository(db);

  const itemIds: string[] = [];
  for (const sample of SAMPLES) {
    const item = items.create({
      type: "webpage",
      title: sample.title,
      url: sample.url,
      domain: sample.domain,
      summary: sample.summary,
    });
    captures.create({
      itemId: item.id,
      markdownPath: `files/markdown/${item.id}.md`,
      extractionStatus: "success",
    });
    const tag = tags.upsert(sample.tag);
    tags.attachToItem(item.id, tag.id);
    search.index({
      itemId: item.id,
      title: sample.title,
      plainText: sample.text,
      summary: sample.summary,
      tags: sample.tag,
    });
    itemIds.push(item.id);
  }
  return { itemIds };
}
