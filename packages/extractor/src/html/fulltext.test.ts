import { describe, expect, it } from "vitest";
import { fulltextFromHtml } from "./fulltext.js";

describe("fulltextFromHtml", () => {
  it("returns empty string for empty or whitespace-only HTML", () => {
    expect(fulltextFromHtml("")).toBe("");
    expect(fulltextFromHtml("   \n  ")).toBe("");
  });

  it("recovers visible text from an app/tool page that has no readable article", () => {
    // spaceship-style: domain search results in a flex layout, no <article>.
    const html = `
      <html><body>
        <nav>Home Pricing Login</nav>
        <main>
          <div class="result"><span>rlzoor.com</span><span>available</span><span>US$8.88</span></div>
          <div class="result"><span>rlzoor.net</span><span>taken</span></div>
        </main>
        <footer>© 2019–2026 Spaceship, Inc. All rights reserved.</footer>
      </body></html>`;
    const text = fulltextFromHtml(html);
    expect(text).toContain("rlzoor.com");
    expect(text).toContain("US$8.88");
    // nav/footer chrome is dropped.
    expect(text).not.toContain("All rights reserved");
    expect(text).not.toContain("Pricing");
  });

  it("recovers a forum main post plus replies", () => {
    const html = `
      <html><body>
        <article class="topic-post"><p>Main post body about the topic.</p></article>
        <article class="topic-post"><p>First reply with a useful point.</p></article>
        <article class="topic-post"><p>Second reply adding context.</p></article>
      </body></html>`;
    const text = fulltextFromHtml(html);
    expect(text).toContain("Main post body");
    expect(text).toContain("First reply");
    expect(text).toContain("Second reply");
  });

  it("separates adjacent block elements so words do not glue together", () => {
    const html = `<body><div>alpha</div><div>beta</div><p>gamma</p></body>`;
    const text = fulltextFromHtml(html);
    expect(text).not.toContain("alphabeta");
    expect(text).toContain("alpha");
    expect(text).toContain("beta");
    expect(text).toContain("gamma");
  });

  it("preserves Chinese content", () => {
    const html = `<body><main><p>这是一段中文正文内容。</p><p>第二段也要保留。</p></main></body>`;
    const text = fulltextFromHtml(html);
    expect(text).toContain("这是一段中文正文内容。");
    expect(text).toContain("第二段也要保留。");
  });

  it("drops script/style noise but keeps body text", () => {
    const html = `<body>
      <style>.x{color:red}</style>
      <script>console.log("noise")</script>
      <main><p>Keep this sentence.</p></main>
    </body>`;
    const text = fulltextFromHtml(html);
    expect(text).toContain("Keep this sentence.");
    expect(text).not.toContain("color:red");
    expect(text).not.toContain("console.log");
  });

  it("returns empty string for a page with no readable text", () => {
    const html = `<body><svg><path d="M0 0"/></svg><div></div></body>`;
    expect(fulltextFromHtml(html)).toBe("");
  });

  it("caps very large pages near the 200KB limit", () => {
    const block = "<p>word word word word word.</p>";
    const html = `<body><main>${block.repeat(20000)}</main></body>`;
    const text = fulltextFromHtml(html);
    expect(text.length).toBeLessThanOrEqual(200_000);
    expect(text.length).toBeGreaterThan(190_000);
  });
});
