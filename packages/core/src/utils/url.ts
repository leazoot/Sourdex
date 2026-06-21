/** URL normalization helpers (PRD §21.1 — URL 规范化 is a required unit-tested util). */

import { ValidationError } from "../errors/errors.js";

/** Query-param name prefixes considered tracking noise and stripped on normalize. */
const TRACKING_PARAM_PREFIXES = ["utm_"];

/** Exact query-param names considered tracking noise and stripped on normalize. */
const TRACKING_PARAMS = new Set([
  "fbclid",
  "gclid",
  "gclsrc",
  "dclid",
  "yclid",
  "mc_cid",
  "mc_eid",
  "igshid",
  "ref_src",
  "_hsenc",
  "_hsmi",
  "spm",
]);

function parseUrl(input: string): URL {
  try {
    return new URL(input.trim());
  } catch (cause) {
    throw new ValidationError(`Invalid URL: ${input}`, { cause });
  }
}

/**
 * Normalize a URL for stable comparison and duplicate detection.
 *
 * - lowercases scheme/host and drops default ports (handled by URL)
 * - removes known tracking query params (utm_*, fbclid, gclid, …)
 * - sorts remaining query params for determinism
 * - drops the fragment (client-only; not part of saved content identity)
 * - removes a trailing slash from non-root paths
 *
 * @throws ValidationError when the input is not a valid URL.
 */
export function normalizeUrl(input: string): string {
  const url = parseUrl(input);

  const params = url.searchParams;
  const toDelete: string[] = [];
  for (const key of params.keys()) {
    const lower = key.toLowerCase();
    const isTracking =
      TRACKING_PARAMS.has(lower) ||
      TRACKING_PARAM_PREFIXES.some((prefix) => lower.startsWith(prefix));
    if (isTracking) toDelete.push(key);
  }
  for (const key of toDelete) params.delete(key);
  params.sort();

  url.hash = "";

  if (url.pathname.length > 1 && url.pathname.endsWith("/")) {
    url.pathname = url.pathname.slice(0, -1);
  }

  return url.toString();
}

/**
 * Extract the registrable host of a URL, without a leading `www.`.
 *
 * @throws ValidationError when the input is not a valid URL.
 */
export function extractDomain(input: string): string {
  const url = parseUrl(input);
  return url.hostname.replace(/^www\./, "");
}
