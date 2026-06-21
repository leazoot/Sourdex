import { describe, expect, it } from "vitest";
import { createDocument } from "./dom.js";
import { precleanDocument } from "./preclean.js";

function clean(html: string): string {
  const doc = createDocument(`<body>${html}</body>`);
  precleanDocument(doc);
  return doc.body.innerHTML;
}

describe("precleanDocument", () => {
  it("removes placeholder / skeleton / loader shells by class token", () => {
    const out = clean(`
      <article><p>Real content here.</p></article>
      <div class="topic-post placeholder"></div>
      <div class="post-skeleton"></div>
      <div class="loading-row"></div>
      <span class="comment ghost"></span>
    `);
    expect(out).toContain("Real content here.");
    expect(out).not.toContain("placeholder");
    expect(out).not.toContain("skeleton");
    expect(out).not.toContain("loading-row");
    expect(out).not.toContain("ghost");
  });

  it("removes placeholder by id token", () => {
    const out = clean(`<div id="post-placeholder"></div><p>keep</p>`);
    expect(out).not.toContain("post-placeholder");
    expect(out).toContain("keep");
  });

  it("drops script/style/noscript/template noise", () => {
    const out = clean(
      `<p>body</p><script>alert(1)</script><style>.x{}</style><noscript>n</noscript><template>t</template>`,
    );
    expect(out).toContain("body");
    expect(out).not.toContain("alert(1)");
    expect(out).not.toContain(".x{}");
  });

  it("does not touch normal content whose class merely contains the word elsewhere", () => {
    // "downloading" / "preloading-tips" must survive — only exact/boundary tokens are noise.
    const out = clean(
      `<div class="downloading">d</div><div class="preloading-tips">p</div><div class="loaded">l</div>`,
    );
    expect(out).toContain(">d<");
    expect(out).toContain(">p<");
    expect(out).toContain(">l<");
  });

  it("leaves a plain article untouched", () => {
    const html = `<article><h1>Title</h1><p>Paragraph one.</p><p>Paragraph two.</p></article>`;
    expect(clean(html)).toContain("Paragraph two.");
    expect(clean(html)).toContain("<h1>Title</h1>");
  });
});
