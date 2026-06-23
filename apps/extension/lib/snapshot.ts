/**
 * Tier 3 self-contained HTML snapshot inliner (docs/16_PROPOSAL_TIER3_SNAPSHOT).
 *
 * Produces a single self-contained HTML string from the rendered page: scripts removed,
 * stylesheets inlined, images turned into data URIs. The goal is "offline, roughly faithful",
 * not pixel-perfect — CSS `url()` resources and web fonts are not inlined here; read-time
 * privacy (no network) is enforced separately by the sandboxed iframe in the Reader.
 *
 * This module is pure and environment-abstracted so it can be unit tested in jsdom. The live
 * in-page routine in capture.ts mirrors this logic, because scripts injected via
 * executeScript({func}) cannot import modules (same constraint as auto-scroll.ts).
 */

export interface SnapshotEnv {
  /** Fetch a text resource (stylesheet). Return null to skip it (best-effort). */
  fetchText: (url: string) => Promise<string | null>;
  /** Fetch a binary resource as a `data:` URI. Return null to skip it (best-effort). */
  fetchDataUri: (url: string) => Promise<string | null>;
  /** Wall clock (ms) for the deadline guard. */
  now: () => number;
}

export interface SnapshotOptions {
  /** Stop inlining further resources once this many ms have elapsed (save-first). */
  deadlineMs: number;
  /** Drop the snapshot entirely if the serialized result exceeds this many bytes. */
  maxBytes: number;
}

export const DEFAULT_SNAPSHOT_OPTIONS: SnapshotOptions = {
  deadlineMs: 4000,
  maxBytes: 5 * 1024 * 1024,
};

const encoder = new TextEncoder();
function byteLength(value: string): number {
  return encoder.encode(value).length;
}

/**
 * Inline a (cloned) document into self-contained HTML. Mutates `doc`. Returns the snapshot
 * string, or null when there is nothing usable or the result exceeds `maxBytes` (the caller
 * then stores no snapshot — the raw HTML is always kept regardless).
 */
export async function buildSnapshot(
  doc: Document,
  env: SnapshotEnv,
  opts: SnapshotOptions = DEFAULT_SNAPSHOT_OPTIONS,
): Promise<string | null> {
  if (!doc.documentElement) return null;
  const start = env.now();
  const overDeadline = (): boolean => env.now() - start > opts.deadlineMs;

  // Active and non-visual content has no place in a static snapshot.
  doc.querySelectorAll("script, noscript").forEach((node) => node.remove());
  // External hints that would phone home at read time but add no visual value.
  doc
    .querySelectorAll('link[rel~="preload"], link[rel~="prefetch"], link[rel~="dns-prefetch"]')
    .forEach((node) => node.remove());

  // Inline stylesheets: <link rel="stylesheet" href> → <style>…css…</style>.
  for (const link of Array.from(doc.querySelectorAll('link[rel~="stylesheet"][href]'))) {
    if (overDeadline()) break;
    const href = link.getAttribute("href");
    if (!href) continue;
    const css = await env.fetchText(href);
    if (css == null) {
      link.remove();
      continue;
    }
    const style = doc.createElement("style");
    style.textContent = css;
    link.replaceWith(style);
  }

  // Inline images as data URIs; drop srcset so the snapshot never fetches at read time.
  for (const img of Array.from(doc.querySelectorAll("img"))) {
    img.removeAttribute("srcset");
    const src = img.getAttribute("src");
    if (!src || src.startsWith("data:")) continue;
    if (overDeadline()) {
      img.removeAttribute("src"); // avoid an external fetch we didn't have time to inline
      continue;
    }
    const dataUri = await env.fetchDataUri(src);
    if (dataUri) img.setAttribute("src", dataUri);
    else img.removeAttribute("src");
  }

  const html = `<!doctype html>\n${doc.documentElement.outerHTML}`;
  if (byteLength(html) > opts.maxBytes) return null;
  return html;
}
