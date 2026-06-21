import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { extractDiscourseArticle } from "./discourse.js";
import { WebpageExtractStrategy } from "../webpage.js";

const fixture = readFileSync(
  fileURLToPath(new URL("../../../test/fixtures/discourse-topic.html", import.meta.url)),
  "utf8",
);

describe("extractDiscourseArticle", () => {
  it("returns null for non-Discourse HTML (fast gate)", () => {
    expect(extractDiscourseArticle("<html><body><article><p>hi</p></article></body></html>")).toBe(
      null,
    );
  });

  it("extracts all loaded posts with author/body", () => {
    const article = extractDiscourseArticle(fixture, "https://forum.example/t/1");
    expect(article).not.toBeNull();
    expect(article?.title).toContain("How do you use AI tools?");
    expect(article?.byline).toBe("alice");
    expect(article?.textContent).toContain("summarizes my notes");
    expect(article?.textContent).toContain("hides all windows");
    expect(article?.textContent).toContain("alice");
    expect(article?.textContent).toContain("bob");
  });

  it("drops not-yet-loaded posts (placeholder / no body)", () => {
    const article = extractDiscourseArticle(fixture, null);
    // carol = placeholder class, dave = no .cooked body → neither should appear.
    expect(article?.textContent).not.toContain("carol");
    expect(article?.textContent).not.toContain("dave");
  });
});

describe("WebpageExtractStrategy with Discourse", () => {
  it("uses the Discourse adapter for forum pages", async () => {
    const result = await new WebpageExtractStrategy().extract({
      sourceType: "webpage",
      html: fixture,
      url: "https://forum.example/t/1",
      title: "How do you use AI tools?",
    });
    expect(result.plainText).toContain("summarizes my notes");
    expect(result.plainText).toContain("hides all windows");
    expect(result.plainText).not.toContain("carol");
    expect(result.markdown).toContain("hides all windows");
  });
});
