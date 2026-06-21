import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { AuthService, loadOrCreateToken } from "./auth.js";

describe("loadOrCreateToken", () => {
  let dir: string;
  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "sourdex-auth-"));
  });
  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it("creates a token file on first call and reuses it afterwards", () => {
    const path = join(dir, "auth.json");
    const first = loadOrCreateToken(path);
    expect(first).toMatch(/^[\w-]{20,}$/);
    expect(JSON.parse(readFileSync(path, "utf8"))).toEqual({ token: first });

    const second = loadOrCreateToken(path);
    expect(second).toBe(first);
  });
});

describe("AuthService", () => {
  it("verifies only the exact Bearer token", () => {
    const auth = new AuthService("secret-token");
    expect(auth.verifyAuthHeader("Bearer secret-token")).toBe(true);
    expect(auth.verifyAuthHeader("Bearer wrong")).toBe(false);
    expect(auth.verifyAuthHeader("secret-token")).toBe(false);
    expect(auth.verifyAuthHeader(undefined)).toBe(false);
    expect(auth.verifyAuthHeader("")).toBe(false);
  });

  it("exchanges a valid pairing code for the token, single-use", () => {
    const auth = new AuthService("the-token");
    const { code, expiresAt } = auth.initiatePairing();
    expect(code).toMatch(/^\d{6}$/);
    expect(new Date(expiresAt).getTime()).toBeGreaterThan(0);

    expect(auth.completePairing(code)).toBe("the-token");
    // Replay fails: codes are invalidated on first use.
    expect(auth.completePairing(code)).toBeNull();
  });

  it("rejects wrong and expired pairing codes", () => {
    let nowMs = 1_000_000;
    const auth = new AuthService("tok", () => nowMs);
    const { code } = auth.initiatePairing();

    expect(auth.completePairing("000000" === code ? "111111" : "000000")).toBeNull();

    nowMs += 6 * 60 * 1000; // past the 5-minute TTL
    expect(auth.completePairing(code)).toBeNull();
  });
});
