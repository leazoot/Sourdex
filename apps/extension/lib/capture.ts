import { browser } from "wxt/browser";
import { authedFetch } from "./api";
import { type CapturePayload, type RawPageData } from "./capture-payload";

export {
  MAX_HTML_BYTES,
  buildCapturePayload,
  byteLength,
  capToBytes,
  type CapturePayload,
  type RawPageData,
} from "./capture-payload";

export interface CaptureResult {
  itemId: string;
  status: "saved" | "exists";
  jobIds: string[];
}

/** Read a specific tab's URL/title/HTML/selection/favicon via a one-shot injected script. */
export async function readTab(tabId: number): Promise<RawPageData> {
  const [injection] = await browser.scripting.executeScript({
    target: { tabId },
    func: () => {
      const icon = document.querySelector<HTMLLinkElement>("link[rel~='icon']");
      return {
        url: location.href,
        title: document.title,
        html: document.documentElement.outerHTML,
        selectedText: window.getSelection()?.toString() ?? "",
        faviconUrl: icon?.href ?? "",
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
