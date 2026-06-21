import { JSDOM } from "jsdom";

/**
 * Parse HTML into a DOM document. Scripts are never executed (JSDOM default) and no
 * external resources are loaded, keeping extraction safe (PRD §17).
 */
export function createDocument(html: string, url?: string | null): Document {
  let options: ConstructorParameters<typeof JSDOM>[1];
  if (url) {
    try {
      // Validate the URL; JSDOM throws on an invalid one.
      new URL(url);
      options = { url };
    } catch {
      options = undefined;
    }
  }
  return new JSDOM(html, options).window.document;
}
