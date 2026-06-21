import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { SecretStoreError } from "@sourdex/core";
import { EncryptedFileSecretStore } from "./encrypted-file-secret-store.js";

let root: string;
let secretsPath: string;
const fixedKey = () => Buffer.from("0123456789abcdef0123456789abcdef");

function makeStore(): EncryptedFileSecretStore {
  return new EncryptedFileSecretStore({ secretsPath, keyMaterial: fixedKey });
}

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), "sourdex-secrets-"));
  secretsPath = join(root, "config", "secrets.enc");
});

afterEach(() => {
  rmSync(root, { recursive: true, force: true });
});

describe("EncryptedFileSecretStore", () => {
  it("round-trips a secret across instances and returns null for missing keys", async () => {
    const store = makeStore();
    expect(await store.get("provider_x")).toBeNull();
    expect(await store.has("provider_x")).toBe(false);

    await store.set("provider_x", "sk-secret-value");

    // A fresh instance reads the persisted, encrypted value back.
    const reopened = makeStore();
    expect(await reopened.get("provider_x")).toBe("sk-secret-value");
    expect(await reopened.has("provider_x")).toBe(true);
  });

  it("overwrites and deletes (delete is idempotent)", async () => {
    const store = makeStore();
    await store.set("k", "first");
    await store.set("k", "second");
    expect(await store.get("k")).toBe("second");

    await store.delete("k");
    expect(await store.get("k")).toBeNull();
    await store.delete("k"); // no throw when already absent
  });

  it("never writes the plaintext secret to disk", async () => {
    const store = makeStore();
    await store.set("provider_x", "sk-PLAINTEXT-LEAK");
    const onDisk = readFileSync(secretsPath, "utf8");
    expect(onDisk).not.toContain("sk-PLAINTEXT-LEAK");
    expect(onDisk).not.toContain("provider_x");
  });

  it("fails clearly when the key material is wrong (tamper/wrong-key)", async () => {
    await makeStore().set("k", "v");
    const wrongKey = new EncryptedFileSecretStore({
      secretsPath,
      keyMaterial: () => Buffer.from("ffffffffffffffffffffffffffffffff"),
    });
    await expect(wrongKey.get("k")).rejects.toBeInstanceOf(SecretStoreError);
  });

  it("fails clearly when the file is corrupted", async () => {
    await makeStore().set("k", "v");
    writeFileSync(secretsPath, "{ not valid json");
    await expect(makeStore().get("k")).rejects.toBeInstanceOf(SecretStoreError);
  });
});
