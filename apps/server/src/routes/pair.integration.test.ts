import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createTestServer, type TestServer } from "../testing.js";

let server: TestServer;

beforeEach(async () => {
  server = await createTestServer();
});

afterEach(async () => {
  await server.cleanup();
});

describe("pairing + auth (OQ-A1)", () => {
  it("rejects protected endpoints without a token", async () => {
    const res = await server.app.inject({ method: "GET", url: "/api/items" });
    expect(res.statusCode).toBe(401);
    expect(res.json()).toMatchObject({ error: "UNAUTHORIZED" });
  });

  it("keeps health public", async () => {
    const res = await server.app.inject({ method: "GET", url: "/api/health" });
    expect(res.statusCode).toBe(200);
  });

  it("initiate returns expiry/length but never the code itself", async () => {
    const res = await server.app.inject({ method: "POST", url: "/api/pair/initiate" });
    expect(res.statusCode).toBe(200);
    const body = res.json() as Record<string, unknown>;
    expect(body).toMatchObject({ codeLength: 6 });
    expect(typeof body.expiresAt).toBe("string");
    expect(body).not.toHaveProperty("code");
    expect(body).not.toHaveProperty("token");
  });

  it("rejects a wrong pairing code", async () => {
    await server.app.inject({ method: "POST", url: "/api/pair/initiate" });
    const res = await server.app.inject({
      method: "POST",
      url: "/api/pair/complete",
      payload: { code: "000000-not-real" },
    });
    expect(res.statusCode).toBe(401);
    expect(res.json()).toMatchObject({ error: "PAIRING_FAILED" });
  });

  it("completes pairing and the returned token authorizes protected endpoints", async () => {
    // Drive the server-side pairing manager to obtain a fresh code, then exchange it
    // over HTTP exactly as the extension would.
    const { code } = server.container.auth.initiatePairing();
    const complete = await server.app.inject({
      method: "POST",
      url: "/api/pair/complete",
      payload: { code },
    });
    expect(complete.statusCode).toBe(200);
    const token = (complete.json() as { token: string }).token;
    expect(token).toBeTruthy();

    const ok = await server.app.inject({
      method: "GET",
      url: "/api/items",
      headers: { authorization: `Bearer ${token}` },
    });
    expect(ok.statusCode).toBe(200);
  });
});
