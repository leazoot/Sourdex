import { describe, expect, it } from "vitest";
import { sanitizeHtml } from "./sanitize.js";

describe("sanitizeHtml", () => {
  it("removes script/style and keeps prose", () => {
    const out = sanitizeHtml(`<p>hello</p><script>alert(1)</script><style>p{}</style>`);
    expect(out).toContain("<p>hello</p>");
    expect(out).not.toContain("alert(1)");
    expect(out).not.toContain("<style");
  });

  it("strips inline event handlers and javascript: urls", () => {
    const out = sanitizeHtml(`<a href="javascript:alert(1)" onclick="steal()">x</a>`);
    expect(out).not.toContain("onclick");
    expect(out).not.toContain("javascript:");
  });
});
