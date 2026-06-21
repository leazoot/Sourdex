import { chmodSync, existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "node:crypto";
import { SecretStoreError, type SecretStore } from "@sourdex/core";

/**
 * Encrypted-file implementation of the `SecretStore` contract (OQ-T7, PRD §17.2).
 *
 * All secrets are kept in a single AES-256-GCM blob at `secretsPath`. The encryption
 * key is derived with scrypt from machine-local key material (a 0600 random key file,
 * by default next to the blob) plus a per-file random salt. This keeps API keys out of
 * the database, config files and logs, and unreadable without the local key file.
 *
 * This is NOT a substitute for an OS Keychain: an attacker with read access to the data
 * directory can read both the key file and the blob. It defends against casual disk/DB
 * inspection and accidental logging. System Keychain is a planned future enhancement.
 */

const FORMAT_VERSION = 1;
const KEY_FILE_BYTES = 32;
const SALT_BYTES = 16;
const IV_BYTES = 12;
const KEY_BYTES = 32;
const FILE_MODE = 0o600;

interface EncryptedBlob {
  v: number;
  salt: string;
  iv: string;
  tag: string;
  ct: string;
}

export interface EncryptedFileSecretStoreOptions {
  /** Path to the encrypted secrets blob. */
  secretsPath: string;
  /**
   * Supplies the raw master key material used to derive the encryption key. Defaults to
   * a 0600 `secret.key` file next to `secretsPath`, created with random bytes on first use.
   * Injectable so tests can pass fixed material without touching the filesystem.
   */
  keyMaterial?: () => Buffer;
}

export class EncryptedFileSecretStore implements SecretStore {
  private readonly secretsPath: string;
  private readonly keyMaterial: () => Buffer;

  constructor(options: EncryptedFileSecretStoreOptions) {
    this.secretsPath = options.secretsPath;
    this.keyMaterial = options.keyMaterial ?? defaultKeyMaterial(options.secretsPath);
  }

  async get(key: string): Promise<string | null> {
    const record = this.load();
    return Object.prototype.hasOwnProperty.call(record, key) ? record[key]! : null;
  }

  async set(key: string, value: string): Promise<void> {
    const record = this.load();
    record[key] = value;
    this.save(record);
  }

  async delete(key: string): Promise<void> {
    const record = this.load();
    if (!Object.prototype.hasOwnProperty.call(record, key)) return;
    delete record[key];
    this.save(record);
  }

  async has(key: string): Promise<boolean> {
    return Object.prototype.hasOwnProperty.call(this.load(), key);
  }

  private load(): Record<string, string> {
    if (!existsSync(this.secretsPath)) return {};
    let blob: EncryptedBlob;
    try {
      blob = JSON.parse(readFileSync(this.secretsPath, "utf8")) as EncryptedBlob;
    } catch (cause) {
      throw new SecretStoreError("Secret store file is corrupted (invalid JSON)", { cause });
    }
    if (blob.v !== FORMAT_VERSION || !blob.salt || !blob.iv || !blob.tag || !blob.ct) {
      throw new SecretStoreError("Secret store file is corrupted (bad format)");
    }
    try {
      const key = this.deriveKey(Buffer.from(blob.salt, "base64"));
      const decipher = createDecipheriv("aes-256-gcm", key, Buffer.from(blob.iv, "base64"));
      decipher.setAuthTag(Buffer.from(blob.tag, "base64"));
      const plaintext = Buffer.concat([
        decipher.update(Buffer.from(blob.ct, "base64")),
        decipher.final(),
      ]).toString("utf8");
      return JSON.parse(plaintext) as Record<string, string>;
    } catch (cause) {
      // Wrong key or tampered ciphertext both surface here as an auth failure.
      throw new SecretStoreError("Failed to decrypt secret store (bad key or tampered file)", {
        cause,
      });
    }
  }

  private save(record: Record<string, string>): void {
    const salt = randomBytes(SALT_BYTES);
    const iv = randomBytes(IV_BYTES);
    const key = this.deriveKey(salt);
    const cipher = createCipheriv("aes-256-gcm", key, iv);
    const ct = Buffer.concat([
      cipher.update(Buffer.from(JSON.stringify(record), "utf8")),
      cipher.final(),
    ]);
    const blob: EncryptedBlob = {
      v: FORMAT_VERSION,
      salt: salt.toString("base64"),
      iv: iv.toString("base64"),
      tag: cipher.getAuthTag().toString("base64"),
      ct: ct.toString("base64"),
    };
    mkdirSync(dirname(this.secretsPath), { recursive: true });
    // Write to a temp file then rename so a crash can't leave a half-written blob.
    const tmp = `${this.secretsPath}.tmp`;
    writeFileSync(tmp, JSON.stringify(blob), { mode: FILE_MODE });
    renameSync(tmp, this.secretsPath);
    chmodSync(this.secretsPath, FILE_MODE);
  }

  private deriveKey(salt: Buffer): Buffer {
    return scryptSync(this.keyMaterial(), salt, KEY_BYTES);
  }
}

/** Default key material: a 0600 random key file next to the secrets blob (created on first use). */
function defaultKeyMaterial(secretsPath: string): () => Buffer {
  const keyPath = join(dirname(secretsPath), "secret.key");
  return () => {
    if (existsSync(keyPath)) return Buffer.from(readFileSync(keyPath, "utf8").trim(), "base64");
    mkdirSync(dirname(keyPath), { recursive: true });
    const material = randomBytes(KEY_FILE_BYTES);
    writeFileSync(keyPath, `${material.toString("base64")}\n`, { mode: FILE_MODE });
    chmodSync(keyPath, FILE_MODE);
    return material;
  };
}
