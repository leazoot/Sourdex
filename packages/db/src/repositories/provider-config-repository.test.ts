import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createMemoryDb } from "../testing.js";
import type { Db, SqliteDatabase } from "../client.js";
import { ProviderConfigRepository } from "./provider-config-repository.js";

let sqlite: SqliteDatabase;
let db: Db;
let repo: ProviderConfigRepository;

beforeEach(() => {
  ({ sqlite, db } = createMemoryDb());
  repo = new ProviderConfigRepository(db);
});

afterEach(() => {
  sqlite.close();
});

describe("ProviderConfigRepository", () => {
  it("creates a config (disabled by default) and reads it back", () => {
    const config = repo.create({
      name: "OpenAI",
      type: "openai-compatible",
      baseUrl: "https://api.openai.com/v1",
      chatModel: "gpt-4o-mini",
    });
    expect(config.id).toMatch(/^pc_/);
    expect(config.enabled).toBe(false);
    expect(config.embeddingModel).toBeNull();
    expect(repo.findById(config.id)).toEqual(config);
  });

  it("lists configs ordered by creation", () => {
    const a = repo.create({ name: "A", type: "ollama" });
    const b = repo.create({ name: "B", type: "openai-compatible", baseUrl: "https://x" });
    expect(repo.list().map((c) => c.id)).toEqual([a.id, b.id]);
  });

  it("applies partial updates and preserves untouched fields", () => {
    const created = repo.create({ name: "X", type: "ollama", chatModel: "llama3" });
    const updated = repo.update(created.id, { enabled: true, baseUrl: "http://localhost:11434" });
    expect(updated?.enabled).toBe(true);
    expect(updated?.baseUrl).toBe("http://localhost:11434");
    expect(updated?.chatModel).toBe("llama3"); // untouched
    expect(updated?.updatedAt).not.toBe(created.updatedAt);
  });

  it("can clear a nullable field explicitly via null", () => {
    const created = repo.create({ name: "X", type: "ollama", chatModel: "llama3" });
    const updated = repo.update(created.id, { chatModel: null });
    expect(updated?.chatModel).toBeNull();
  });

  it("returns null when updating a missing config", () => {
    expect(repo.update("pc_missing", { enabled: true })).toBeNull();
  });

  it("deletes a config and reports whether a row was removed", () => {
    const created = repo.create({ name: "X", type: "ollama" });
    expect(repo.delete(created.id)).toBe(true);
    expect(repo.findById(created.id)).toBeNull();
    expect(repo.delete(created.id)).toBe(false);
  });
});
