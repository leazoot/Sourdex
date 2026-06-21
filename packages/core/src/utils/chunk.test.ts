import { describe, expect, it } from "vitest";
import { chunkText, estimateTokens } from "./chunk.js";

describe("chunkText", () => {
  it("returns no chunks for empty/whitespace text", () => {
    expect(chunkText("")).toEqual([]);
    expect(chunkText("   \n\n  ")).toEqual([]);
  });

  it("returns a single chunk for short text", () => {
    const chunks = chunkText("A short paragraph about search.", { targetTokens: 100 });
    expect(chunks.length).toBe(1);
    expect(chunks[0].chunkIndex).toBe(0);
    expect(chunks[0].text).toBe("A short paragraph about search.");
    expect(chunks[0].tokenCount).toBeGreaterThan(0);
  });

  it("splits long text into multiple overlapping chunks with traceable offsets", () => {
    const para = (n: number) => `Paragraph ${n} ${"word ".repeat(20)}`.trim();
    const text = Array.from({ length: 10 }, (_, i) => para(i)).join("\n\n");

    const chunks = chunkText(text, { targetTokens: 60, overlapTokens: 20 });
    expect(chunks.length).toBeGreaterThan(1);

    chunks.forEach((c, i) => {
      expect(c.chunkIndex).toBe(i);
      // Offsets point back into the original text (citation traceability).
      expect(text.slice(c.startOffset, c.endOffset)).toContain(c.text.slice(0, 8));
      expect(c.tokenCount).toBeLessThanOrEqual(60 + 20); // target + carried overlap
    });

    // Adjacent chunks overlap: the later chunk starts before the earlier one ends.
    expect(chunks[1].startOffset).toBeLessThan(chunks[0].endOffset);
  });

  it("hard-splits a single oversized paragraph", () => {
    const huge = "sentence ".repeat(400); // one paragraph, no blank lines
    const chunks = chunkText(huge, { targetTokens: 50, overlapTokens: 10 });
    expect(chunks.length).toBeGreaterThan(1);
  });

  it("estimateTokens counts Latin words and CJK characters", () => {
    expect(estimateTokens("hello world")).toBe(2);
    expect(estimateTokens("向量检索")).toBe(4);
  });
});
