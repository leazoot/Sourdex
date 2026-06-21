import { describe, expect, it } from "vitest";
import { countWords, readingTimeMinutes } from "./metrics.js";

describe("countWords", () => {
  it("counts Latin words", () => {
    expect(countWords("hello world foo")).toBe(3);
  });

  it("counts CJK characters individually", () => {
    expect(countWords("本地优先")).toBe(4);
  });

  it("counts mixed CJK + Latin", () => {
    expect(countWords("SQLite 全文搜索")).toBe(1 + 4);
  });

  it("returns 0 for empty", () => {
    expect(countWords("   ")).toBe(0);
  });
});

describe("readingTimeMinutes", () => {
  it("is 0 for no words", () => {
    expect(readingTimeMinutes(0)).toBe(0);
  });

  it("is at least 1 for any content", () => {
    expect(readingTimeMinutes(10)).toBe(1);
  });

  it("scales by ~200 wpm", () => {
    expect(readingTimeMinutes(450)).toBe(3);
  });
});
