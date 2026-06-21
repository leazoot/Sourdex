import type { Item, Tag } from "@sourdex/core";
import { describe, expect, it } from "vitest";
import { toCsvExport, toJsonExport, type StructuredExportRecord } from "./structured.js";

function makeItem(over: Partial<Item> = {}): Item {
  return {
    id: "item_1",
    type: "webpage",
    status: "inbox",
    title: "Example",
    url: "https://example.com",
    canonicalUrl: null,
    domain: "example.com",
    author: null,
    publishedAt: null,
    savedAt: "2026-06-20T10:00:00.000Z",
    updatedAt: "2026-06-20T10:00:00.000Z",
    summary: null,
    oneSentence: null,
    thumbnailPath: null,
    sourceHash: null,
    wordCount: 0,
    readingTime: 0,
    aiStatus: "none",
    ...over,
  };
}

function tag(name: string): Tag {
  return {
    id: `tag_${name}`,
    name,
    normalizedName: name.toLowerCase(),
    type: "manual",
    createdAt: "x",
  };
}

function record(over: Partial<StructuredExportRecord> = {}): StructuredExportRecord {
  return { item: makeItem(), tags: [], content: null, ...over };
}

describe("toJsonExport", () => {
  it("emits a structured archive with metadata, tags and content", () => {
    const json = toJsonExport([
      record({ item: makeItem({ summary: "S" }), tags: [tag("ai")], content: "# Body" }),
    ]);
    const parsed = JSON.parse(json) as {
      count: number;
      items: { title: string; tags: string[]; content: string; summary: string }[];
    };
    expect(parsed.count).toBe(1);
    expect(parsed.items[0]?.title).toBe("Example");
    expect(parsed.items[0]?.tags).toEqual(["ai"]);
    expect(parsed.items[0]?.content).toBe("# Body");
    expect(parsed.items[0]?.summary).toBe("S");
  });

  it("includes annotations when present", () => {
    const json = toJsonExport([
      record({
        annotations: [
          {
            id: "anno_1",
            itemId: "item_1",
            chunkId: null,
            selectedText: "local-first",
            note: "core idea",
            color: "amber",
            createdAt: "x",
            updatedAt: "x",
          },
        ],
      }),
    ]);
    const parsed = JSON.parse(json) as {
      items: { annotations: { selectedText: string; note: string }[] }[];
    };
    expect(parsed.items[0]?.annotations[0]?.selectedText).toBe("local-first");
    expect(parsed.items[0]?.annotations[0]?.note).toBe("core idea");
  });
});

describe("toCsvExport", () => {
  it("emits a header and one row per item with tags joined", () => {
    const csv = toCsvExport([record({ tags: [tag("ai"), tag("research")] })]);
    const lines = csv.split("\r\n");
    expect(lines[0]).toBe("title,url,domain,type,saved_at,tags");
    expect(lines[1]).toBe(
      "Example,https://example.com,example.com,webpage,2026-06-20T10:00:00.000Z,ai; research",
    );
  });

  it("escapes commas, quotes and keeps Chinese titles intact (RFC 4180)", () => {
    const csv = toCsvExport([
      record({ item: makeItem({ title: 'A "quoted", title 机器学习', url: null, domain: null }) }),
    ]);
    const row = csv.split("\r\n")[1] ?? "";
    expect(row).toContain('"A ""quoted"", title 机器学习"');
    // Empty url/domain become empty cells, not "null".
    expect(row).toContain(",,");
  });
});
