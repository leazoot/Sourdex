import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { randomBytes, randomInt, timingSafeEqual } from "node:crypto";

/** Pairing codes expire quickly; the user has to read one off the server console. */
const PAIRING_TTL_MS = 5 * 60 * 1000;
const PAIRING_CODE_LENGTH = 6;

/**
 * Load the persistent local-service token, generating one on first run (OQ-A1, 方案B).
 * The token is high-entropy and written 0600 so only the local user can read it; it is
 * never logged and never returned by any unauthenticated endpoint.
 */
export function loadOrCreateToken(tokenPath: string): string {
  if (existsSync(tokenPath)) {
    const raw: unknown = JSON.parse(readFileSync(tokenPath, "utf8"));
    if (raw && typeof raw === "object" && typeof (raw as { token?: unknown }).token === "string") {
      return (raw as { token: string }).token;
    }
  }
  const token = randomBytes(32).toString("base64url");
  writeFileSync(tokenPath, `${JSON.stringify({ token }, null, 2)}\n`, { mode: 0o600 });
  return token;
}

interface PendingPairing {
  code: string;
  expiresAtMs: number;
}

/**
 * Auth + pairing for the browser extension (OQ-A1, 方案B 配对码换取 token).
 *
 * Pairing flow: the extension asks the server (loopback-only) to start pairing; the
 * server prints a short single-use code to its own console and the user types it into
 * the extension, which exchanges it for the long-lived Bearer token. Codes are never
 * sent over the network in a response, so a malicious local page cannot read one.
 */
export class AuthService {
  private pending: PendingPairing | null = null;

  constructor(
    private readonly token: string,
    private readonly now: () => number = () => Date.now(),
  ) {}

  /** Constant-time check of an `Authorization: Bearer <token>` header. */
  verifyAuthHeader(header: string | undefined): boolean {
    if (!header) return false;
    const match = /^Bearer (.+)$/.exec(header);
    if (!match?.[1]) return false;
    const provided = Buffer.from(match[1]);
    const expected = Buffer.from(this.token);
    if (provided.length !== expected.length) return false;
    return timingSafeEqual(provided, expected);
  }

  /**
   * Start a pairing session: generate a fresh single-use code (replacing any prior one)
   * and return it plus its expiry. The route logs the code to the console and returns
   * only the expiry to the client.
   */
  initiatePairing(): { code: string; expiresAt: string } {
    const code = String(randomInt(0, 10 ** PAIRING_CODE_LENGTH)).padStart(PAIRING_CODE_LENGTH, "0");
    const expiresAtMs = this.now() + PAIRING_TTL_MS;
    this.pending = { code, expiresAtMs };
    return { code, expiresAt: new Date(expiresAtMs).toISOString() };
  }

  /** Exchange a pairing code for the token. Returns null on wrong/expired/used code. */
  completePairing(code: string): string | null {
    const pending = this.pending;
    if (!pending) return null;
    if (this.now() > pending.expiresAtMs) {
      this.pending = null;
      return null;
    }
    const provided = Buffer.from(code);
    const expected = Buffer.from(pending.code);
    const ok = provided.length === expected.length && timingSafeEqual(provided, expected);
    if (!ok) return null;
    // Single use: invalidate immediately so a code can't be replayed.
    this.pending = null;
    return this.token;
  }
}
