import { defineBackground } from "wxt/utils/define-background";
import { browser } from "wxt/browser";
import { NotConnectedError, NotPairedError } from "@/lib/api";
import { buildCapturePayload, readTab, saveWebpage } from "@/lib/capture";

const MENU_ID = "sourdex-save-selection";

/** Brief action-badge feedback (no notifications permission needed). */
async function flashBadge(text: string, color: string): Promise<void> {
  await browser.action.setBadgeBackgroundColor({ color });
  await browser.action.setBadgeText({ text });
  setTimeout(() => void browser.action.setBadgeText({ text: "" }), 2500);
}

function isCapturable(url: string | undefined): boolean {
  return !!url && (url.startsWith("http://") || url.startsWith("https://"));
}

/** Capture a tab (optionally with an explicit selection) and reflect the result on the badge. */
async function saveTab(
  tabId: number,
  url: string | undefined,
  selectionText?: string,
): Promise<void> {
  if (!isCapturable(url)) {
    await flashBadge("!", "#b5694f");
    return;
  }
  try {
    const raw = await readTab(tabId);
    const payload = buildCapturePayload(
      { ...raw, selectedText: selectionText ?? raw.selectedText },
      new Date().toISOString(),
    );
    await saveWebpage(payload);
    await flashBadge("✓", "#7d875f");
  } catch (error) {
    await flashBadge("!", "#b5694f");
    if (error instanceof NotPairedError) {
      await browser.runtime.openOptionsPage();
    } else if (!(error instanceof NotConnectedError)) {
      console.error("Sourdex save failed", error);
    }
  }
}

export default defineBackground(() => {
  browser.runtime.onInstalled.addListener(() => {
    browser.contextMenus.create({
      id: MENU_ID,
      title: "Save selection to Sourdex",
      contexts: ["selection"],
    });
  });

  browser.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId !== MENU_ID || !tab?.id) return;
    void saveTab(tab.id, tab.url, info.selectionText);
  });

  // Keyboard shortcut (manifest command save-page = ⌘⇧S / Ctrl+Shift+S).
  browser.commands.onCommand.addListener((command) => {
    if (command !== "save-page") return;
    void (async () => {
      const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
      if (tab?.id) await saveTab(tab.id, tab.url);
    })();
  });
});
