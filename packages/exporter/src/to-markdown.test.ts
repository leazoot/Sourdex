import type { Item, Tag } from "@sourdex/core";
import { describe, expect, it } from "vitest";
import { buildFrontmatter } from "./frontmatter.js";
import { toMarkdownDocument } from "./to-markdown.js";

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

describe("buildFrontmatter", () => {
  it("emits the PRD §5.1.7 fields with a quoted tag array", () => {
    const fm = buildFrontmatter(makeItem(), [tag("ai"), tag("research")]);
    expect(fm).toContain(`title: "Example"`);
    expect(fm).toContain(`url: "https://example.com"`);
    expect(fm).toContain(`domain: "example.com"`);
    expect(fm).toContain(`saved_at: "2026-06-20T10:00:00.000Z"`);
    expect(fm).toContain(`type: "webpage"`);
    expect(fm).toContain(`tags: ["ai", "research"]`);
    expect(fm.startsWith("---\n")).toBe(true);
    expect(fm.endsWith("\n---")).toBe(true);
  });

  it("omits url/domain when absent and emits an empty tag array", () => {
    const fm = buildFrontmatter(makeItem({ url: null, domain: null }), []);
    expect(fm).not.toContain("url:");
    expect(fm).not.toContain("domain:");
    expect(fm).toContain("tags: []");
  });

  it("escapes quotes and backslashes in titles (special chars don't break export)", () => {
    const fm = buildFrontmatter(makeItem({ title: 'A "quoted" \\ path' }), []);
    expect(fm).toContain(`title: "A \\"quoted\\" \\\\ path"`);
  });

  it("keeps Chinese titles intact", () => {
    const fm = buildFrontmatter(makeItem({ title: "机器学习导论" }), [tag("机器学习")]);
    expect(fm).toContain(`title: "机器学习导论"`);
    expect(fm).toContain(`tags: ["机器学习"]`);
  });
});

describe("toMarkdownDocument", () => {
  it("assembles frontmatter, title, source, summary and content (PRD example)", () => {
    const doc = toMarkdownDocument({
      item: makeItem({ summary: "A short summary." }),
      tags: [tag("ai")],
      content: "# Body\n\nThe article body.",
    });
    expect(doc).toContain(`title: "Example"`);
    expect(doc).toContain("# Example");
    expect(doc).toContain("Source: https://example.com");
    expect(doc).toContain("## Summary\n\nA short summary.");
    expect(doc).toContain("## Content\n\n# Body\n\nThe article body.");
  });

  it("omits the summary section when there is no summary", () => {
    const doc = toMarkdownDocument({ item: makeItem(), tags: [], content: "body" });
    expect(doc).not.toContain("## Summary");
  });

  it("falls back to a placeholder when content is empty", () => {
    const doc = toMarkdownDocument({ item: makeItem(), tags: [], content: null });
    expect(doc).toContain("## Content\n\n_No extracted content._");
  });
});
