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

describe("extractDiscourseArticle — preload fallback", () => {
  // Long topics captured scrolled away from the top have their .topic-post nodes unloaded by
  // virtual scrolling; the posts then survive only in the embedded data-preloaded JSON.
  const preloadEnvelope = {
    topic_2450876: JSON.stringify({
      title: "Preloaded Topic Title",
      post_stream: {
        posts: [
          {
            cooked: "<p>Body from preload one.</p>",
            username: "omnis",
            created_at: "2026-06-22T10:00:00Z",
          },
          {
            cooked: "<p>Body from preload two.</p>",
            username: "nottake",
            created_at: "2026-06-22T10:05:00Z",
          },
        ],
      },
    }),
  };
  // The attribute is HTML-escaped JSON; jsdom decodes &quot; back to " on getAttribute.
  const dataAttr = JSON.stringify(preloadEnvelope).replace(/"/g, "&quot;");
  const preloadHtml = `<!doctype html><html><head>
    <meta name="generator" content="Discourse 2026.6.0">
    <title>Preloaded Topic Title - Forum</title></head>
    <body><div id="main-outlet"></div>
    <div id="data-preloaded" data-preloaded="${dataAttr}"></div>
    </body></html>`;

  it("recovers posts from the preload JSON when no .topic-post is rendered", () => {
    const article = extractDiscourseArticle(preloadHtml, "https://forum.example/t/2450876");
    expect(article).not.toBeNull();
    expect(article?.title).toBe("Preloaded Topic Title");
    expect(article?.byline).toBe("omnis");
    expect(article?.textContent).toContain("Body from preload one.");
    expect(article?.textContent).toContain("Body from preload two.");
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
