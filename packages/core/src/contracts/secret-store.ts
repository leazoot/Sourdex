/**
 * Secret storage contract (PRD §17.2). Implemented in apps/server.
 *
 * Holds sensitive values (API keys) outside the regular database and config files.
 * Keys are opaque identifiers (e.g. a provider config id); values are plaintext
 * secrets that the implementation is responsible for encrypting at rest. Secrets
 * must never be logged or returned to the client (PRD §17.1, §17.2).
 */
export interface SecretStore {
  /** Return the stored secret for `key`, or null if absent. */
  get(key: string): Promise<string | null>;
  /** Store (or overwrite) the secret for `key`. */
  set(key: string, value: string): Promise<void>;
  /** Remove the secret for `key`. Must not throw if it is already absent. */
  delete(key: string): Promise<void>;
  /** Whether a secret exists for `key` (without exposing its value). */
  has(key: string): Promise<boolean>;
}
