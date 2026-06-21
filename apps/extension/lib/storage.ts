import { browser } from "wxt/browser";
import { TOKEN_KEY } from "./config";

/** Read the paired token, or null if the extension has not been paired yet. */
export async function getToken(): Promise<string | null> {
  const result = await browser.storage.local.get(TOKEN_KEY);
  const value = result[TOKEN_KEY];
  return typeof value === "string" ? value : null;
}

export async function setToken(token: string): Promise<void> {
  await browser.storage.local.set({ [TOKEN_KEY]: token });
}

export async function clearToken(): Promise<void> {
  await browser.storage.local.remove(TOKEN_KEY);
}
