import { describe, expect, it } from "vitest";
import { ExtractionError } from "@sourdex/core";
import { createExtractor } from "./extractor.js";

const extractor = createExtractor();

const para =
  "This is a sufficiently long paragraph of real prose so that the readability algorithm treats the surrounding element as the main article content rather than boilerplate navigation. ";

const englishBlog = `<!doctype html><html><head><title>My Blog Post</title></head><body>
<header><nav>Home About Contact</nav></header>
<article><h1>My Blog Post</h1>
<p>${para}${para}</p>
<p>${para}${para}</p>
<p>The second section continues the discussion with more detail and examples. ${para}</p>
</article>
<footer>Copyright 2026 — subscribe to our newsletter and follow us everywhere.</footer>
</body></html>`;

const chineseArticle = `<!doctype html><html><head><title>中文文章标题</title></head><body>
<nav>首页 关于 联系</nav>
<article><h1>中文文章标题</h1>
<p>这是一篇用于测试正文提取的中文文章。我们需要足够长的段落内容，这样可读性算法才会把这一块识别为正文，而不是导航或者页脚等样板内容。本段反复强调本地优先的资料索引理念。</p>
<p>第二段继续讨论全文搜索与可溯源问答的设计目标，并补充更多细节与例子，以确保提取算法能够稳定地识别正文区域并返回纯文本内容。</p>
</article>
<footer>版权所有 2026</footer>
</body></html>`;

const techDoc = `<!doctype html><html><head><title>Using SQLite FTS5</title></head><body>
<article><h1>Using SQLite FTS5</h1>
<p>${para}${para}</p>
<p>Create a virtual table to enable full text search across your documents and notes. ${para}</p>
<pre><code>CREATE VIRTUAL TABLE docs USING fts5(title, body);</code></pre>
<p>Then query it with the MATCH operator to retrieve ranked results. ${para}</p>
</article></body></html>`;

const failurePage = `<!doctype html><html><head><title>Nope</title></head><body>
<nav>menu</nav><p>   </p></body></html>`;

describe("createExtractor — webpage", () => {
  it("extracts an English blog and strips chrome", async () => {
    const result = await extractor.extract({
      sourceType: "webpage",
      url: "https://example.com/post",
      html: englishBlog,
    });
    expect(result.title).toBe("My Blog Post");
    expect(result.contentKind).toBe("article");
    expect(result.plainText).toContain("readability algorithm");
    expect(result.plainText).not.toContain("subscribe to our newsletter");
    expect(result.markdown.length).toBeGreaterThan(0);
    expect(result.wordCount).toBeGreaterThan(0);
    expect(result.readingTime).toBeGreaterThanOrEqual(1);
  });

  it("extracts a Chinese article", async () => {
    const result = await extractor.extract({
      sourceType: "webpage",
      url: "https://example.cn/a",
      html: chineseArticle,
    });
    expect(result.plainText).toContain("本地优先");
    expect(result.wordCount).toBeGreaterThan(0);
  });

  it("keeps code blocks as fenced markdown for technical docs", async () => {
    const result = await extractor.extract({
      sourceType: "webpage",
      url: "https://example.com/fts",
      html: techDoc,
    });
    expect(result.markdown).toContain("```");
    expect(result.markdown).toContain("CREATE VIRTUAL TABLE");
  });

  it("throws ExtractionError when the page has no readable text at all", async () => {
    // No article and no recoverable full text — stays a bookmark.
    await expect(
      extractor.extract({ sourceType: "webpage", url: "https://example.com/x", html: failurePage }),
    ).rejects.toBeInstanceOf(ExtractionError);
  });

  it("throws ExtractionError when no HTML is provided", async () => {
    await expect(
      extractor.extract({ sourceType: "webpage", url: "https://example.com/x", html: "" }),
    ).rejects.toBeInstanceOf(ExtractionError);
  });

  it("recovers visible content from an app/tool page instead of dropping it", async () => {
    // A domain-search tool has no clean article. Whether via Readability or the Tier 2
    // full-text fallback, the rendered results must be saved and searchable (FC2).
    const appPage = `<!doctype html><html><head><title>Domain Search</title></head><body>
<nav>Domains Pricing Hosting</nav>
<main>
  <div class="result"><span>rlzoor.com</span><span>available</span><span>US$8.88</span></div>
  <div class="result"><span>rlzoor.net</span><span>taken</span></div>
</main>
<footer>© 2019–2026 Spaceship, Inc. All rights reserved.</footer>
</body></html>`;
    const result = await extractor.extract({
      sourceType: "webpage",
      url: "https://www.spaceship.com/domain-search/",
      html: appPage,
    });
    expect(["article", "fulltext"]).toContain(result.contentKind);
    expect(result.plainText).toContain("rlzoor.com");
    expect(result.plainText).toContain("US$8.88");
    expect(result.wordCount).toBeGreaterThan(0);
  });

  it("degrades a short, boilerplate-only page to full text rather than failing", async () => {
    // Even a footer-only page is kept as full text ("something beats nothing"); the Reader
    // labels it as full page text. Only a genuinely empty page fails.
    const footerOnly = `<!doctype html><html><head><title>Tool</title></head><body>
<nav>Domains Pricing</nav>
<article><p>© 2019–2026 Spaceship, Inc. All rights reserved.</p></article>
</body></html>`;
    const result = await extractor.extract({
      sourceType: "webpage",
      url: "https://www.spaceship.com/x/",
      html: footerOnly,
    });
    expect(result.contentKind).toBe("fulltext");
    expect(result.plainText).toContain("Spaceship");
  });
});

describe("createExtractor — dispatch", () => {
  it("extracts a selection", async () => {
    const result = await extractor.extract({
      sourceType: "selection",
      url: "https://example.com",
      selectedText: "a saved snippet of text",
    });
    expect(result.plainText).toBe("a saved snippet of text");
  });

  it("throws ExtractionError for an unsupported source type", async () => {
    await expect(
      extractor.extract({ sourceType: "pdf", url: null, html: "<p>x</p>" }),
    ).rejects.toBeInstanceOf(ExtractionError);
  });
});
