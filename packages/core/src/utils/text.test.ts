import { describe, expect, it } from "vitest";
import { segmentCjk } from "./text.js";

describe("segmentCjk", () => {
  it("splits a run of CJK characters into per-character tokens", () => {
    expect(segmentCjk("机器学习")).toBe("机 器 学 习");
  });

  it("leaves pure Latin text untouched", () => {
    expect(segmentCjk("hello world")).toBe("hello world");
  });

  it("separates Latin words from adjacent CJK characters", () => {
    expect(segmentCjk("AI模型")).toBe("AI 模 型");
  });

  it("handles mixed CJK and Latin with existing spaces", () => {
    expect(segmentCjk("学习 Rust 语言")).toBe("学 习 Rust 语 言");
  });

  it("returns an empty string for blank input", () => {
    expect(segmentCjk("   ")).toBe("");
  });

  it("segments Japanese kana and kanji", () => {
    expect(segmentCjk("日本語")).toBe("日 本 語");
  });
});
