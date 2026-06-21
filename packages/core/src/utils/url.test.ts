import { describe, expect, it } from "vitest";
import { extractDomain, normalizeUrl } from "./url.js";
import { ValidationError } from "../errors/errors.js";

describe("normalizeUrl", () => {
  it("lowercases scheme and host", () => {
    expect(normalizeUrl("HTTPS://Example.COM/Path")).toBe("https://example.com/Path");
  });

  it("drops default ports", () => {
    expect(normalizeUrl("https://example.com:443/a")).toBe("https://example.com/a");
    expect(normalizeUrl("http://example.com:80/a")).toBe("http://example.com/a");
  });

  it("removes tracking params (utm_*, fbclid, gclid)", () => {
    expect(
      normalizeUrl("https://example.com/p?utm_source=x&utm_medium=y&id=42&fbclid=z&gclid=w"),
    ).toBe("https://example.com/p?id=42");
  });

  it("keeps non-tracking params and sorts them", () => {
    expect(normalizeUrl("https://example.com/p?b=2&a=1")).toBe("https://example.com/p?a=1&b=2");
  });

  it("drops the fragment", () => {
    expect(normalizeUrl("https://example.com/p#section")).toBe("https://example.com/p");
  });

  it("removes a trailing slash from non-root paths but keeps root", () => {
    expect(normalizeUrl("https://example.com/p/")).toBe("https://example.com/p");
    expect(normalizeUrl("https://example.com/")).toBe("https://example.com/");
  });

  it("trims surrounding whitespace", () => {
    expect(normalizeUrl("  https://example.com/p  ")).toBe("https://example.com/p");
  });

  it("is idempotent", () => {
    const once = normalizeUrl("https://Example.com/p/?utm_source=x&b=2&a=1#frag");
    expect(normalizeUrl(once)).toBe(once);
  });

  it("throws ValidationError on invalid input", () => {
    expect(() => normalizeUrl("not a url")).toThrow(ValidationError);
  });
});

describe("extractDomain", () => {
  it("returns the host without a leading www.", () => {
    expect(extractDomain("https://www.example.com/a/b")).toBe("example.com");
    expect(extractDomain("https://sub.example.com/")).toBe("sub.example.com");
  });

  it("throws ValidationError on invalid input", () => {
    expect(() => extractDomain("::::")).toThrow(ValidationError);
  });
});
