import type { Annotation, Item, Tag } from "@sourdex/core";

/** One item plus its associations, ready for a structured (JSON/CSV) export (PRD §8.9). */
export interface StructuredExportRecord {
  item: Item;
  tags: Tag[];
  content: string | null;
  annotations?: Annotation[];
}

/** Full structured archive with metadata, tags, annotations and content (PRD §8.9 JSON export). */
export function toJsonExport(records: StructuredExportRecord[]): string {
  const items = records.map(({ item, tags, content, annotations }) => ({
    id: item.id,
    type: item.type,
    status: item.status,
    title: item.title,
    url: item.url,
    canonicalUrl: item.canonicalUrl,
    domain: item.domain,
    author: item.author,
    publishedAt: item.publishedAt,
    savedAt: item.savedAt,
    summary: item.summary,
    oneSentence: item.oneSentence,
    wordCount: item.wordCount,
    readingTime: item.readingTime,
    tags: tags.map((t) => t.name),
    annotations: (annotations ?? []).map((a) => ({
      selectedText: a.selectedText,
      note: a.note,
      color: a.color,
    })),
    content,
  }));
  return JSON.stringify({ count: items.length, items }, null, 2);
}

const CSV_COLUMNS = ["title", "url", "domain", "type", "saved_at", "tags"] as const;

/** Quote a field when it contains a comma/quote/newline; double internal quotes (RFC 4180). */
function csvField(value: string): string {
  return /[",\r\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

/** Flat spreadsheet table — title, url, domain, type, saved, tags (PRD §8.9 CSV export). */
export function toCsvExport(records: StructuredExportRecord[]): string {
  const rows = [CSV_COLUMNS.join(",")];
  for (const { item, tags } of records) {
    const cells = [
      item.title,
      item.url ?? "",
      item.domain ?? "",
      item.type,
      item.savedAt,
      tags.map((t) => t.name).join("; "),
    ];
    rows.push(cells.map(csvField).join(","));
  }
  return rows.join("\r\n");
}
