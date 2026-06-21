import { describe, expect, it } from "vitest";
import {
  HYBRID_WEIGHTS,
  hybridScore,
  normalizeSimilarities,
  recencyScore,
  tagScore,
} from "./hybrid.js";

describe("hybridScore", () => {
  it("weights signals per the PRD §15.3 formula", () => {
    expect(HYBRID_WEIGHTS.keyword).toBe(0.4);
    const full = hybridScore({
      keywordScore: 1,
      semanticScore: 1,
      tagScore: 1,
      recencyScore: 1,
      userSignalScore: 1,
    });
    expect(full).toBeCloseTo(1);
    expect(hybridScore({ keywordScore: 1 })).toBeCloseTo(0.4);
    expect(hybridScore({ semanticScore: 1 })).toBeCloseTo(0.35);
    expect(hybridScore({})).toBe(0);
  });
});

describe("recencyScore", () => {
  const now = Date.parse("2026-06-21T00:00:00.000Z");
  it("is ~1 for a fresh save and 0.5 at the half-life", () => {
    expect(recencyScore("2026-06-21T00:00:00.000Z", now)).toBeCloseTo(1);
    expect(recencyScore("2026-05-22T00:00:00.000Z", now)).toBeCloseTo(0.5, 1); // ~30 days
  });
  it("returns 0 for an unparseable date", () => {
    expect(recencyScore("not-a-date", now)).toBe(0);
  });
});

describe("tagScore", () => {
  it("is the fraction of query tokens matching any tag (substring, case-insensitive)", () => {
    expect(tagScore(["react", "hooks"], ["React Hooks"])).toBeCloseTo(1);
    expect(tagScore(["react", "vue"], ["react"])).toBeCloseTo(0.5);
    expect(tagScore(["python"], ["react"])).toBe(0);
    expect(tagScore([], ["react"])).toBe(0);
    expect(tagScore(["react"], [])).toBe(0);
  });
});

describe("normalizeSimilarities", () => {
  it("scales relative to the best, mapping non-positive to 0", () => {
    expect(normalizeSimilarities([0.8, 0.4, 0])).toEqual([1, 0.5, 0]);
    expect(normalizeSimilarities([-0.2, 0])).toEqual([0, 0]);
    expect(normalizeSimilarities([])).toEqual([]);
  });
});
