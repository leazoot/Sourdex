import { describe, expect, it } from "vitest";
import { buildCapturePayload, byteLength, capToBytes, type RawPageData } from "./capture-payload";

const raw = (over: Partial<RawPageData> = {}): RawPageData => ({
  url: "https://example.com/post",
  title: "Example",
  html: "<html><body><p>hi</p></body></html>",
  selectedText: "",
  faviconUrl: "",
  ...over,
});

describe("capToBytes", () => {
  it("returns the input unchanged when within the limit", () => {
    expect(capToBytes("hello", 100)).toBe("hello");
  });

  it("truncates to at most maxBytes without splitting a multibyte char", () => {
    const s = "汉".repeat(10); // each char is 3 UTF-8 bytes
    const out = capToBytes(s, 7); // fits 2 full chars (6 bytes), not a partial 3rd
    expect(out).toBe("汉汉");
    expect(byteLength(out)).toBeLessThanOrEqual(7);
  });
});

describe("buildCapturePayload", () => {
  it("marks truncated and caps html when over the limit (OQ-R3)", () => {
    const big = "x".repeat(100);
    const payload = buildCapturePayload(raw({ html: big }), "2026-06-20T00:00:00.000Z", 50);
    expect(payload.truncated).toBe(true);
    expect(byteLength(payload.html)).toBeLessThanOrEqual(50);
  });

  it("keeps html intact and truncated=false under the limit", () => {
    const payload = buildCapturePayload(raw(), "2026-06-20T00:00:00.000Z");
    expect(payload.truncated).toBe(false);
    expect(payload.html).toContain("<p>hi</p>");
  });

  it("omits empty selectedText/faviconUrl and trims them", () => {
    const empty = buildCapturePayload(raw({ selectedText: "  " }), "t");
    expect(empty).not.toHaveProperty("selectedText");
    expect(empty).not.toHaveProperty("faviconUrl");

    const withSel = buildCapturePayload(raw({ selectedText: "  hi  " }), "t");
    expect(withSel.selectedText).toBe("hi");
  });

  it("falls back to the url when the title is empty", () => {
    const payload = buildCapturePayload(raw({ title: "" }), "t");
    expect(payload.title).toBe("https://example.com/post");
  });
});
