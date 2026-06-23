import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createTestServer, type TestServer } from "../../testing.js";

let server: TestServer;

const para =
  "This is a sufficiently long paragraph of real prose so that the readability algorithm treats the surrounding element as the main article content rather than boilerplate. ";

const articleHtml = `<!doctype html><html><head><title>Real Article</title></head><body>
<nav>menu</nav>
<article><h1>Real Article</h1><p>${para}${para}</p><p>${para}${para}</p></article>
<footer>foot</footer></body></html>`;

const unextractableHtml = `<!doctype html><html><head><title>Nope</title></head><body><nav>menu</nav><p>   </p></body></html>`;

beforeEach(async () => {
  server = await createTestServer();
});

afterEach(async () => {
  await server.cleanup();
});

describe("extract_content job", () => {
  it("extracts content and makes the body searchable", async () => {
    const { itemId } = await server.container.captureService.captureWebpage({
      url: "https://example.com/real",
      title: "Real Article",
      html: articleHtml,
    });

    expect(await server.container.worker.processOnce()).toBe(true);

    const capture = server.container.captureRepo.findByItemId(itemId);
    expect(capture?.extractionStatus).toBe("success");
    expect(capture?.markdownPath).toContain("files/markdown/");
    expect(capture?.readableHtmlPath).toContain("files/readable-html/");
    expect(capture?.contentKind).toBe("article");

    const item = server.container.itemRepo.findById(itemId);
    expect(item?.wordCount).toBeGreaterThan(0);
    expect(item?.readingTime).toBeGreaterThanOrEqual(1);

    const content = await server.container.itemService.getContent(itemId);
    expect(content.contentKind).toBe("article");

    const hits = server.container.searchRepo.search("readability");
    expect(hits.map((h) => h.itemId)).toContain(itemId);
  });

  it("degrades an app/tool page to faithful full text (contentKind=fulltext)", async () => {
    const appHtml = `<!doctype html><html><head><title>Domain Search</title></head><body>
<nav>Domains Pricing</nav>
<article><p>© 2019–2026 Spaceship, Inc. All rights reserved.</p></article>
</body></html>`;
    const { itemId } = await server.container.captureService.captureWebpage({
      url: "https://www.spaceship.com/x/",
      title: "Domain Search",
      html: appHtml,
    });

    expect(await server.container.worker.processOnce()).toBe(true);

    const capture = server.container.captureRepo.findByItemId(itemId);
    expect(capture?.extractionStatus).toBe("success");
    expect(capture?.contentKind).toBe("fulltext");

    const content = await server.container.itemService.getContent(itemId);
    expect(content.contentKind).toBe("fulltext");
    expect(content.plainText).toContain("Spaceship");
  });

  it("falls back to the saved selection when readability fails", async () => {
    const { itemId } = await server.container.captureService.captureWebpage({
      url: "https://example.com/fail-with-selection",
      title: "Has Selection",
      html: unextractableHtml,
      selectedText: "an important highlighted snippet about pelicans",
    });

    await server.container.worker.processOnce();

    const capture = server.container.captureRepo.findByItemId(itemId);
    expect(capture?.extractionStatus).toBe("success");

    const hits = server.container.searchRepo.search("pelicans");
    expect(hits.map((h) => h.itemId)).toContain(itemId);
  });

  it("marks failed but retains raw html when extraction fails and there is no selection", async () => {
    const { itemId } = await server.container.captureService.captureWebpage({
      url: "https://example.com/fail",
      title: "No Selection",
      html: unextractableHtml,
    });

    await server.container.worker.processOnce();

    const capture = server.container.captureRepo.findByItemId(itemId);
    expect(capture?.extractionStatus).toBe("failed");
    expect(capture?.extractionError).toBeTruthy();
    expect(capture?.rawHtmlPath).toContain("files/raw-html/"); // raw retained

    // Item still exists and is listed (title was indexed at save time).
    expect(server.container.itemRepo.findById(itemId)?.status).toBe("inbox");
  });
});
