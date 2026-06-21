import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { NotFoundError, type SecretStore } from "@sourdex/core";
import { createMemoryDb, ProviderConfigRepository, type SqliteDatabase } from "@sourdex/db";
import { ProviderConfigService } from "./provider-config-service.js";

/** Minimal in-memory SecretStore for tests. */
class MemorySecretStore implements SecretStore {
  readonly map = new Map<string, string>();
  async get(key: string) {
    return this.map.get(key) ?? null;
  }
  async set(key: string, value: string) {
    this.map.set(key, value);
  }
  async delete(key: string) {
    this.map.delete(key);
  }
  async has(key: string) {
    return this.map.has(key);
  }
}

let sqlite: SqliteDatabase;
let secrets: MemorySecretStore;
let service: ProviderConfigService;

beforeEach(() => {
  const mem = createMemoryDb();
  sqlite = mem.sqlite;
  secrets = new MemorySecretStore();
  service = new ProviderConfigService({
    repo: new ProviderConfigRepository(mem.db),
    secrets,
  });
});

afterEach(() => {
  sqlite.close();
});

describe("ProviderConfigService", () => {
  it("stores the API key in the SecretStore, not in the config view", async () => {
    const view = await service.create({
      name: "OpenAI",
      type: "openai-compatible",
      baseUrl: "https://api.openai.com/v1",
      apiKey: "sk-secret",
    });
    expect(view.hasApiKey).toBe(true);
    expect(JSON.stringify(view)).not.toContain("sk-secret");
    expect(secrets.map.get(view.id)).toBe("sk-secret");
  });

  it("creates without a key (e.g. Ollama) and reports hasApiKey=false", async () => {
    const view = await service.create({ name: "Ollama", type: "ollama" });
    expect(view.hasApiKey).toBe(false);
    expect(secrets.map.size).toBe(0);
  });

  it("update: string replaces, null clears, undefined leaves the key untouched", async () => {
    const created = await service.create({
      name: "X",
      type: "openai-compatible",
      baseUrl: "https://x",
      apiKey: "key-1",
    });

    await service.update(created.id, { apiKey: "key-2" });
    expect(secrets.map.get(created.id)).toBe("key-2");

    const unchanged = await service.update(created.id, { name: "X2" });
    expect(unchanged?.name).toBe("X2");
    expect(secrets.map.get(created.id)).toBe("key-2"); // untouched

    const cleared = await service.update(created.id, { apiKey: null });
    expect(cleared?.hasApiKey).toBe(false);
    expect(secrets.map.has(created.id)).toBe(false);
  });

  it("remove deletes both the config and its stored key", async () => {
    const created = await service.create({
      name: "X",
      type: "openai-compatible",
      baseUrl: "https://x",
      apiKey: "key",
    });
    expect(await service.remove(created.id)).toBe(true);
    expect(await service.get(created.id)).toBeNull();
    expect(secrets.map.has(created.id)).toBe(false);
  });

  it("list reflects stored-key status without exposing keys", async () => {
    await service.create({ name: "A", type: "ollama" });
    await service.create({
      name: "B",
      type: "openai-compatible",
      baseUrl: "https://x",
      apiKey: "k",
    });
    const list = await service.list();
    expect(list.map((c) => c.hasApiKey)).toEqual([false, true]);
  });

  it("testConnection builds a provider with the stored key and returns ok", async () => {
    let receivedKey: string | undefined;
    const svc = new ProviderConfigService({
      repo: new ProviderConfigRepository(createMemoryDb().db),
      secrets,
      createProvider: (_config, opts) => {
        receivedKey = opts.apiKey;
        return { chat: async () => ({ content: "pong", model: "m" }) };
      },
    });
    const created = await svc.create({
      name: "X",
      type: "openai-compatible",
      baseUrl: "https://x",
      apiKey: "sk-test",
    });
    const result = await svc.testConnection(created.id);
    expect(result).toEqual({ ok: true, model: "m" });
    expect(receivedKey).toBe("sk-test");
  });

  it("testConnection throws NotFoundError for a missing config", async () => {
    await expect(service.testConnection("pc_missing")).rejects.toBeInstanceOf(NotFoundError);
  });
});
