import { describe, expect, it } from "vitest";
import {
  buildMatchExpression,
  cleanSnippet,
  HIGHLIGHT_CLOSE,
  HIGHLIGHT_OPEN,
  normalizeScores,
  tokenizeQuery,
} from "./query.js";

const O = HIGHLIGHT_OPEN;
const C = HIGHLIGHT_CLOSE;

describe("tokenizeQuery", () => {
  it("splits on whitespace", () => {
    expect(tokenizeQuery("foo bar baz")).toEqual(["foo", "bar", "baz"]);
  });

  it("keeps quoted phrases intact", () => {
    expect(tokenizeQuery('foo "bar baz" qux')).toEqual(["foo", "bar baz", "qux"]);
  });

  it("returns an empty array for blank input", () => {
    expect(tokenizeQuery("   ")).toEqual([]);
  });
});

describe("buildMatchExpression", () => {
  it("AND-combines quoted FTS string literals", () => {
    expect(buildMatchExpression("foo bar")).toBe('"foo" "bar"');
  });

  it("CJK-segments each term into a phrase (OQ-A7)", () => {
    expect(buildMatchExpression("机器")).toBe('"机 器"');
    expect(buildMatchExpression("机器学习")).toBe('"机 器 学 习"');
  });

  it("escapes embedded double quotes so input cannot inject FTS syntax", () => {
    expect(buildMatchExpression('a"b')).toBe('"a""b"');
  });

  it("neutralizes FTS operators by quoting them", () => {
    expect(buildMatchExpression("foo OR bar")).toBe('"foo" "OR" "bar"');
  });

  it("returns null when there is nothing to match", () => {
    expect(buildMatchExpression("   ")).toBeNull();
    expect(buildMatchExpression("")).toBeNull();
  });
});

describe("cleanSnippet", () => {
  it("drops the spaces inserted between CJK characters", () => {
    expect(cleanSnippet("机 器 学 习")).toBe("机器学习");
  });

  it("preserves Latin word spacing", () => {
    expect(cleanSnippet("hello world")).toBe("hello world");
  });

  it("merges adjacent per-character highlights and de-segments inside them", () => {
    expect(cleanSnippet(`${O}机${C} ${O}器${C}`)).toBe(`${O}机器${C}`);
  });

  it("removes the space between a highlight marker and an adjacent CJK character", () => {
    expect(cleanSnippet(`前 ${O}机 器${C} 后`)).toBe(`前${O}机器${C}后`);
  });
});

describe("normalizeScores", () => {
  it("maps the best (most negative) bm25 to 1.0 and scales the rest", () => {
    expect(normalizeScores([-5, -2])).toEqual([1, 0.4]);
  });

  it("scores a single result as 1.0", () => {
    expect(normalizeScores([-3.2])).toEqual([1]);
  });

  it("returns an empty array for no hits", () => {
    expect(normalizeScores([])).toEqual([]);
  });
});
