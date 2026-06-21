import { expect, test } from "@playwright/test";
import { E2E } from "./test-env";

// The v0.1 acceptance journey (PRD §21.3): a webpage is saved through the local capture API
// (what the extension calls), the background worker extracts + indexes it, then the whole loop
// is driven through the real Web UI: Inbox → Search → Reader → Export Markdown.
//
// FIND_TOKEN lives only in the page body (never the title), so search matches the extracted
// full text while the result title still renders as one unsplit text node (the title is not
// wrapped in highlight <mark> markers), keeping the locators stable.
const FIND_TOKEN = "zylophoria";
const TITLE = "Readable Local-First Journey";
const PAGE = {
  url: "https://example.com/e2e/local-first-journey",
  title: TITLE,
  html:
    "<html><body><article>" +
    `<h1>${TITLE}</h1>` +
    `<p>This article body is long enough to extract cleanly and mentions ${FIND_TOKEN} as a unique findable token.</p>` +
    `<p>本地优先的资料索引库，用于验证全文搜索 ${FIND_TOKEN} 是否可被检索，并保留更多正文以便稳定提取。</p>` +
    "</article></body></html>",
};

const authHeader = { authorization: `Bearer ${E2E.token}` };

test.describe("v0.1 critical loop", () => {
  test("save → inbox → search → reader → export markdown", async ({ page, request }) => {
    let itemId = "";

    await test.step("1. save a webpage via the local capture API", async () => {
      const res = await request.post(`${E2E.serverUrl}/api/captures/webpage`, {
        headers: authHeader,
        data: { url: PAGE.url, title: PAGE.title, html: PAGE.html, forceNew: true },
      });
      expect(res.status()).toBe(201);
      const body = (await res.json()) as { itemId: string; status: string };
      expect(body.status).toBe("saved");
      itemId = body.itemId;
      expect(itemId).toBeTruthy();
    });

    await test.step("2. the background worker extracts and indexes the content", async () => {
      await expect
        .poll(
          async () => {
            const res = await request.get(`${E2E.serverUrl}/api/items/${itemId}/content`, {
              headers: authHeader,
            });
            if (!res.ok()) return "";
            const body = (await res.json()) as { plainText: string | null };
            return body.plainText ?? "";
          },
          { timeout: 15_000, intervals: [250, 500, 1000] },
        )
        .toContain(FIND_TOKEN);
    });

    await test.step("3. the saved item appears in the Inbox", async () => {
      await page.goto("/");
      await expect(page.getByRole("heading", { name: TITLE })).toBeVisible();
    });

    await test.step("4. full-text search finds the item by a body keyword", async () => {
      await page.goto("/search");
      await page.getByPlaceholder(/Search your library/i).fill(FIND_TOKEN);
      await expect(page.getByRole("button", { name: new RegExp(TITLE) })).toBeVisible();
    });

    await test.step("5a. open the reader from the search result", async () => {
      await page.getByRole("button", { name: new RegExp(TITLE) }).click();
      await expect(page).toHaveURL(new RegExp(`/reader/${itemId}$`));
      await expect(page.getByRole("heading", { level: 1, name: TITLE })).toBeVisible();
      await expect(page.getByText(FIND_TOKEN).first()).toBeVisible();
    });

    await test.step("5b. export the item to Markdown", async () => {
      await page.getByRole("button", { name: "Export", exact: true }).click();
      await expect(page.getByText(/Exported to/i)).toBeVisible();
    });
  });
});
