/** OQ-R3: cap the page HTML the extension sends at 2 MB; the server extractor cleans it. */
export const MAX_HTML_BYTES = 2 * 1024 * 1024;

/** OQ-T3-2: cap the self-contained snapshot at 5 MB; over the cap, send no snapshot. */
export const MAX_SNAPSHOT_BYTES = 5 * 1024 * 1024;

/** Raw data pulled from the active tab before sizing/normalization. */
export interface RawPageData {
  url: string;
  title: string;
  html: string;
  selectedText: string;
  faviconUrl: string;
  /** Best-effort self-contained HTML snapshot (Tier 3); absent when generation failed/over cap. */
  snapshotHtml?: string;
}

export interface CapturePayload {
  url: string;
  title: string;
  html: string;
  selectedText?: string;
  faviconUrl?: string;
  /** Self-contained page snapshot (Tier 3); omitted when unavailable or over the size cap. */
  snapshotHtml?: string;
  capturedAt: string;
  /** True when the HTML exceeded MAX_HTML_BYTES and was truncated (surfaced in UI). */
  truncated: boolean;
}

const encoder = new TextEncoder();

export function byteLength(value: string): number {
  return encoder.encode(value).length;
}

/** Largest prefix of `value` whose UTF-8 size is ≤ maxBytes (never splits a code point). */
export function capToBytes(value: string, maxBytes: number): string {
  if (byteLength(value) <= maxBytes) return value;
  let lo = 0;
  let hi = value.length;
  while (lo < hi) {
    const mid = Math.ceil((lo + hi) / 2);
    if (byteLength(value.slice(0, mid)) <= maxBytes) lo = mid;
    else hi = mid - 1;
  }
  return value.slice(0, lo);
}

/** Build the capture request body from raw tab data, enforcing the size cap (pure). */
export function buildCapturePayload(
  raw: RawPageData,
  now: string,
  maxBytes = MAX_HTML_BYTES,
  maxSnapshotBytes = MAX_SNAPSHOT_BYTES,
): CapturePayload {
  const truncated = byteLength(raw.html) > maxBytes;
  const html = truncated ? capToBytes(raw.html, maxBytes) : raw.html;
  const selectedText = raw.selectedText.trim();
  const faviconUrl = raw.faviconUrl.trim();
  // A snapshot is all-or-nothing: a truncated snapshot is broken HTML, so drop it if over cap.
  const snapshotHtml =
    raw.snapshotHtml && byteLength(raw.snapshotHtml) <= maxSnapshotBytes
      ? raw.snapshotHtml
      : undefined;
  return {
    url: raw.url,
    title: raw.title || raw.url,
    html,
    ...(selectedText ? { selectedText } : {}),
    ...(faviconUrl ? { faviconUrl } : {}),
    ...(snapshotHtml ? { snapshotHtml } : {}),
    capturedAt: now,
    truncated,
  };
}
