import { API_BASE } from "@/lib/config";

/** Local service unreachable (not running / blocked). */
export class NotConnectedError extends Error {
  constructor() {
    super("Could not reach the local Sourdex service");
    this.name = "NotConnectedError";
  }
}

/** Service returned an error status; carries a readable message (never a raw stack). */
export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/** Paired token for the local Web UI (OQ-W1): dev env var, or injected in production. */
function getToken(): string | undefined {
  const fromEnv = import.meta.env.VITE_SOURDEX_API_TOKEN;
  if (fromEnv) return fromEnv;
  return window.__SOURDEX__?.token;
}

async function readErrorMessage(res: Response): Promise<string> {
  try {
    const body = (await res.json()) as { message?: unknown };
    if (typeof body.message === "string") return body.message;
  } catch {
    // fall through
  }
  return `Request failed (${res.status})`;
}

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getToken();
  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      ...init,
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...init.headers,
      },
    });
  } catch {
    throw new NotConnectedError();
  }
  if (!res.ok) throw new ApiError(await readErrorMessage(res), res.status);
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}
