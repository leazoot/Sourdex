// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { formatNumber, formatRelativeTime } from "./format";

describe("formatNumber", () => {
  it("groups thousands", () => {
    expect(formatNumber(6210)).toBe("6,210");
  });
});

describe("formatRelativeTime", () => {
  it("renders a relative phrase for a past time", () => {
    const now = Date.parse("2026-06-20T12:00:00.000Z");
    const twoHoursAgo = new Date(now - 2 * 60 * 60 * 1000).toISOString();
    expect(formatRelativeTime(twoHoursAgo, now)).toMatch(/hour/);
  });

  it("returns empty string for an invalid date", () => {
    expect(formatRelativeTime("not-a-date")).toBe("");
  });
});
