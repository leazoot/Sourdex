import { createDocument } from "./dom.js";

const DANGEROUS_TAGS = [
  "script",
  "style",
  "noscript",
  "iframe",
  "object",
  "embed",
  "form",
  "link",
  "meta",
];

/**
 * Sanitize readable HTML before it is stored and later rendered (PRD §17 — readable
 * HTML is shown in the reader). Removes dangerous elements, inline event handlers and
 * javascript: URLs.
 */
export function sanitizeHtml(html: string): string {
  const document = createDocument(`<body>${html}</body>`);
  const body = document.body;

  for (const tag of DANGEROUS_TAGS) {
    body.querySelectorAll(tag).forEach((node) => node.remove());
  }

  body.querySelectorAll("*").forEach((el) => {
    for (const attr of Array.from(el.attributes)) {
      const name = attr.name.toLowerCase();
      const value = attr.value.trim().toLowerCase();
      if (name.startsWith("on")) el.removeAttribute(attr.name);
      else if ((name === "href" || name === "src") && value.startsWith("javascript:")) {
        el.removeAttribute(attr.name);
      }
    }
  });

  return body.innerHTML;
}
