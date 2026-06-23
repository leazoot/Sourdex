import { browser } from "wxt/browser";
import { authedFetch } from "./api";
import { DEFAULT_AUTO_SCROLL } from "./auto-scroll";
import { type CapturePayload, type RawPageData } from "./capture-payload";

export {
  MAX_HTML_BYTES,
  MAX_SNAPSHOT_BYTES,
  buildCapturePayload,
  byteLength,
  capToBytes,
  type CapturePayload,
  type RawPageData,
} from "./capture-payload";

/** In-page snapshot budget (Tier 3). Best-effort: bounded so it never holds up the save. */
const SNAPSHOT_BUDGET = { deadlineMs: 3000, maxBytes: 5 * 1024 * 1024 };

export interface CaptureResult {
  itemId: string;
  status: "saved" | "exists";
  jobIds: string[];
}

/** Read a specific tab's URL/title/HTML/selection/favicon via a one-shot injected script. */
export async function readTab(tabId: number): Promise<RawPageData> {
  const [injection] = await browser.scripting.executeScript({
    target: { tabId },
    args: [DEFAULT_AUTO_SCROLL, SNAPSHOT_BUDGET],
    // Auto-scroll first so lazy / virtualized content is in the DOM before we read it, then
    // build a best-effort self-contained snapshot. Both mirror lib/auto-scroll.ts and
    // lib/snapshot.ts because injected scripts cannot import modules.
    func: async (scroll: typeof DEFAULT_AUTO_SCROLL, snap: typeof SNAPSHOT_BUDGET) => {
      const start = Date.now();
      let lastHeight = document.documentElement.scrollHeight;
      let stable = 0;
      let steps = 0;
      while (
        steps < scroll.maxScrolls &&
        stable < scroll.stableThreshold &&
        Date.now() - start < scroll.maxDurationMs
      ) {
        window.scrollTo(0, document.documentElement.scrollHeight);
        await new Promise((resolve) => setTimeout(resolve, scroll.stepDelayMs));
        steps++;
        const height = document.documentElement.scrollHeight;
        if (height <= lastHeight) stable++;
        else {
          stable = 0;
          lastHeight = height;
        }
      }
      window.scrollTo(0, 0);

      // Best-effort Tier 3 snapshot (mirror of lib/snapshot.ts). Wrapped so any failure
      // leaves capture untouched — the raw HTML is always saved regardless.
      const buildSnapshot = async (): Promise<string | undefined> => {
        try {
          const snapStart = Date.now();
          const overDeadline = () => Date.now() - snapStart > snap.deadlineMs;
          const snapDoc = document.implementation.createHTMLDocument("");
          snapDoc.replaceChild(
            snapDoc.importNode(document.documentElement, true),
            snapDoc.documentElement,
          );
          // Resolve relative URLs against the live page when serializing.
          const base = snapDoc.createElement("base");
          base.setAttribute("href", document.baseURI);
          snapDoc.head?.insertBefore(base, snapDoc.head.firstChild);

          snapDoc.querySelectorAll("script, noscript").forEach((n) => n.remove());
          snapDoc
            .querySelectorAll(
              'link[rel~="preload"], link[rel~="prefetch"], link[rel~="dns-prefetch"]',
            )
            .forEach((n) => n.remove());

          const fetchText = async (url: string): Promise<string | null> => {
            try {
              const r = await fetch(url);
              return r.ok ? await r.text() : null;
            } catch {
              return null;
            }
          };
          const fetchDataUri = async (url: string): Promise<string | null> => {
            try {
              const r = await fetch(url);
              if (!r.ok) return null;
              const blob = await r.blob();
              return await new Promise<string | null>((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () =>
                  resolve(typeof reader.result === "string" ? reader.result : null);
                reader.onerror = () => resolve(null);
                reader.readAsDataURL(blob);
              });
            } catch {
              return null;
            }
          };

          for (const link of Array.from(
            snapDoc.querySelectorAll<HTMLLinkElement>('link[rel~="stylesheet"][href]'),
          )) {
            if (overDeadline()) break;
            const css = await fetchText(link.href);
            if (css == null) {
              link.remove();
              continue;
            }
            const style = snapDoc.createElement("style");
            style.textContent = css;
            link.replaceWith(style);
          }

          for (const img of Array.from(snapDoc.querySelectorAll("img"))) {
            img.removeAttribute("srcset");
            const src = img.getAttribute("src");
            if (!src || src.startsWith("data:")) continue;
            if (overDeadline()) {
              img.removeAttribute("src");
              continue;
            }
            const dataUri = await fetchDataUri(img.src);
            if (dataUri) img.setAttribute("src", dataUri);
            else img.removeAttribute("src");
          }

          const html = `<!doctype html>\n${snapDoc.documentElement.outerHTML}`;
          if (new TextEncoder().encode(html).length > snap.maxBytes) return undefined;
          return html;
        } catch {
          return undefined;
        }
      };

      const icon = document.querySelector<HTMLLinkElement>("link[rel~='icon']");
      const snapshotHtml = await buildSnapshot();
      return {
        url: location.href,
        title: document.title,
        html: document.documentElement.outerHTML,
        selectedText: window.getSelection()?.toString() ?? "",
        faviconUrl: icon?.href ?? "",
        ...(snapshotHtml ? { snapshotHtml } : {}),
      };
    },
  });
  const result = injection?.result;
  if (!result) throw new Error("Could not read the current page");
  return result;
}

/** Read the active tab in the current window. */
export async function readActiveTab(): Promise<RawPageData> {
  const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) throw new Error("No active tab");
  return readTab(tab.id);
}

/** Post a capture to the local service (authenticated). `truncated` is UI-only metadata. */
export async function saveWebpage(payload: CapturePayload): Promise<CaptureResult> {
  const { truncated: _truncated, ...body } = payload;
  return authedFetch<CaptureResult>("/api/captures/webpage", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}
