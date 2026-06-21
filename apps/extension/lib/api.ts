import { API_BASE } from "./config";
import { clearToken, getToken, setToken } from "./storage";

/** The local service is unreachable (not running, wrong port, blocked). */
export class NotConnectedError extends Error {
  constructor() {
    super("Could not reach the local Sourdex service");
    this.name = "NotConnectedError";
  }
}

/** The service is reachable but the extension is not paired (no/invalid token). */
export class NotPairedError extends Error {
  constructor() {
    super("Extension is not paired with the local service");
    this.name = "NotPairedError";
  }
}

/** A service-side error with a readable message (never a raw stack). */
export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

type ConnectionState = "connected" | "unpaired" | "disconnected";

async function rawFetch(path: string, init?: RequestInit): Promise<Response> {
  try {
    return await fetch(`${API_BASE}${path}`, init);
  } catch {
    // fetch only rejects on network failure; HTTP errors resolve normally.
    throw new NotConnectedError();
  }
}

/** Authenticated request. Throws NotPairedError when unpaired or the token is rejected. */
export async function authedFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = await getToken();
  if (!token) throw new NotPairedError();

  const res = await rawFetch(path, {
    ...init,
    headers: { ...init.headers, Authorization: `Bearer ${token}` },
  });
  if (res.status === 401) {
    await clearToken();
    throw new NotPairedError();
  }
  if (!res.ok) {
    const message = await readErrorMessage(res);
    throw new ApiError(message, res.status);
  }
  return (await res.json()) as T;
}

async function readErrorMessage(res: Response): Promise<string> {
  try {
    const body = (await res.json()) as { message?: unknown };
    if (typeof body.message === "string") return body.message;
  } catch {
    // fall through to a generic message
  }
  return `Request failed (${res.status})`;
}

/** Liveness probe (unauthenticated). */
export async function checkHealth(): Promise<boolean> {
  const res = await rawFetch("/api/health");
  return res.ok;
}

/** Start pairing: the service prints a code to its console; we only learn the expiry. */
export async function initiatePairing(): Promise<{ expiresAt: string; codeLength: number }> {
  const res = await rawFetch("/api/pair/initiate", { method: "POST" });
  if (!res.ok) throw new ApiError(await readErrorMessage(res), res.status);
  return (await res.json()) as { expiresAt: string; codeLength: number };
}

/** Exchange a pairing code for the token and persist it. */
export async function completePairing(code: string): Promise<void> {
  const res = await rawFetch("/api/pair/complete", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code }),
  });
  if (!res.ok) throw new ApiError(await readErrorMessage(res), res.status);
  const { token } = (await res.json()) as { token: string };
  await setToken(token);
}

/** Resolve the overall connection state for status UI. */
export async function getConnectionState(): Promise<ConnectionState> {
  let reachable: boolean;
  try {
    reachable = await checkHealth();
  } catch {
    return "disconnected";
  }
  if (!reachable) return "disconnected";

  try {
    await authedFetch("/api/status");
    return "connected";
  } catch (error) {
    if (error instanceof NotPairedError) return "unpaired";
    return "disconnected";
  }
}
