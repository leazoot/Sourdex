import { createHash } from "node:crypto";
import { normalizeUrl } from "@sourdex/core";

function safeNormalize(url: string): string {
  try {
    return normalizeUrl(url);
  } catch {
    return url.trim();
  }
}

/**
 * Compute a stable source hash for duplicate detection (decision OQ-A4).
 *
 * Prefers the normalized canonical URL, falls back to the normalized URL, and finally
 * to the raw content (for URL-less captures such as plain selections).
 */
export function computeSourceHash(input: {
  canonicalUrl?: string | null;
  url?: string | null;
  content?: string | null;
}): string {
  const basis = input.canonicalUrl ?? input.url ?? null;
  const material = basis ? `url:${safeNormalize(basis)}` : `content:${input.content ?? ""}`;
  return createHash("sha256").update(material).digest("hex");
}
