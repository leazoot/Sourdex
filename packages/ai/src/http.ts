import { AIProviderError } from "@sourdex/core";

/** Minimal response shape we depend on (subset of the Fetch `Response`). */
export interface HttpResponse {
  ok: boolean;
  status: number;
  text(): Promise<string>;
}

/** Minimal fetch signature, injectable for testing (DI). Defaults to global `fetch`. */
export type FetchLike = (
  url: string,
  init: { method: string; headers: Record<string, string>; body: string },
) => Promise<HttpResponse>;

/**
 * POST a JSON body and parse a JSON response, mapping transport/HTTP/parse failures to
 * `AIProviderError`. Never includes the request body or auth header in the error (PRD §17.1).
 */
export async function postJson(
  fetchFn: FetchLike,
  url: string,
  headers: Record<string, string>,
  body: unknown,
): Promise<unknown> {
  let response: HttpResponse;
  try {
    response = await fetchFn(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...headers },
      body: JSON.stringify(body),
    });
  } catch (cause) {
    throw new AIProviderError(`Could not reach AI provider at ${url}`, { cause });
  }
  const raw = await response.text();
  if (!response.ok) {
    throw new AIProviderError(`AI provider returned HTTP ${response.status}`, {
      cause: raw.slice(0, 500),
    });
  }
  try {
    return JSON.parse(raw) as unknown;
  } catch (cause) {
    throw new AIProviderError("AI provider returned a non-JSON response", { cause });
  }
}

/** Safely read a string property from an unknown object, or undefined. */
export function readString(obj: unknown, ...path: string[]): string | undefined {
  let cur: unknown = obj;
  for (const key of path) {
    if (typeof cur !== "object" || cur === null) return undefined;
    cur = (cur as Record<string, unknown>)[key];
  }
  return typeof cur === "string" ? cur : undefined;
}
