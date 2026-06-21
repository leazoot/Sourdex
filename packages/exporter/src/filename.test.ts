import { describe, expect, it } from "vitest";
import { safeFilename, uniqueFilename } from "./filename.js";

describe("safeFilename", () => {
  it("replaces illegal filesystem characters (no separators leak through)", () => {
    const out = safeFilename('a/b:c*d?e"f<g>h|i');
    expect(out).toBe("a b c d e f g h i.md");
    expect(out).not.toMatch(/[\\/:*?"<>|]/);
  });

  it("collapses whitespace and trims", () => {
    expect(safeFilename("  hello   world  ")).toBe("hello world.md");
  });

  it("keeps Chinese characters intact", () => {
    expect(safeFilename("机器学习导论")).toBe("机器学习导论.md");
  });

  it("falls back to 'untitled' for empty or all-illegal titles", () => {
    expect(safeFilename("")).toBe("untitled.md");
    expect(safeFilename("///")).toBe("untitled.md");
    expect(safeFilename("...")).toBe("untitled.md");
  });

  it("avoids Windows reserved device names", () => {
    expect(safeFilename("CON")).toBe("CON_.md");
    expect(safeFilename("nul")).toBe("nul_.md");
  });

  it("byte-truncates very long titles without splitting multibyte chars", () => {
    const out = safeFilename("机".repeat(200));
    const base = out.replace(/\.md$/, "");
    expect(new TextEncoder().encode(base).length).toBeLessThanOrEqual(100);
    // No replacement character from a split multibyte sequence.
    expect(base).not.toContain("�");
  });

  it("applies a custom extension", () => {
    expect(safeFilename("report", ".json")).toBe("report.json");
  });
});

describe("uniqueFilename", () => {
  it("returns the name unchanged when not taken", () => {
    const taken = new Set<string>();
    expect(uniqueFilename("a.md", taken)).toBe("a.md");
  });

  it("appends a numeric suffix on collision", () => {
    const taken = new Set<string>();
    expect(uniqueFilename("a.md", taken)).toBe("a.md");
    expect(uniqueFilename("a.md", taken)).toBe("a-1.md");
    expect(uniqueFilename("a.md", taken)).toBe("a-2.md");
  });
});
