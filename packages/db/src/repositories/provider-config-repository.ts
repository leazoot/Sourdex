import { createId, nowIso, type ProviderConfig, type ProviderType } from "@sourdex/core";
import { asc, eq } from "drizzle-orm";
import type { Db } from "../client.js";
import { providerConfigs } from "../schema.js";
import { mapProviderConfig } from "../mappers.js";

/** Fields a caller may set when creating a provider config (PRD §12.9). */
export interface CreateProviderConfigInput {
  name: string;
  type: ProviderType;
  baseUrl?: string | null;
  chatModel?: string | null;
  embeddingModel?: string | null;
  enabled?: boolean;
}

/** Patchable fields when updating a provider config. */
export type UpdateProviderConfigInput = Partial<CreateProviderConfigInput>;

/**
 * Data access for AI provider configs (PRD §12.9). Holds non-secret config only —
 * API keys never live here; they go to the SecretStore (PRD §17.2).
 */
export class ProviderConfigRepository {
  constructor(private readonly db: Db) {}

  create(input: CreateProviderConfigInput): ProviderConfig {
    const now = nowIso();
    const row = this.db
      .insert(providerConfigs)
      .values({
        id: createId("pc"),
        name: input.name,
        type: input.type,
        baseUrl: input.baseUrl ?? null,
        chatModel: input.chatModel ?? null,
        embeddingModel: input.embeddingModel ?? null,
        enabled: input.enabled ?? false,
        createdAt: now,
        updatedAt: now,
      })
      .returning()
      .get();
    return mapProviderConfig(row);
  }

  findById(id: string): ProviderConfig | null {
    const row = this.db.select().from(providerConfigs).where(eq(providerConfigs.id, id)).get();
    return row ? mapProviderConfig(row) : null;
  }

  list(): ProviderConfig[] {
    const rows = this.db
      .select()
      .from(providerConfigs)
      .orderBy(asc(providerConfigs.createdAt))
      .all();
    return rows.map(mapProviderConfig);
  }

  /** Apply a partial update; returns the updated config or null if it does not exist. */
  update(id: string, patch: UpdateProviderConfigInput): ProviderConfig | null {
    const existing = this.db.select().from(providerConfigs).where(eq(providerConfigs.id, id)).get();
    if (!existing) return null;
    const row = this.db
      .update(providerConfigs)
      .set({
        name: patch.name ?? existing.name,
        type: patch.type ?? existing.type,
        baseUrl: patch.baseUrl === undefined ? existing.baseUrl : patch.baseUrl,
        chatModel: patch.chatModel === undefined ? existing.chatModel : patch.chatModel,
        embeddingModel:
          patch.embeddingModel === undefined ? existing.embeddingModel : patch.embeddingModel,
        enabled: patch.enabled ?? existing.enabled,
        updatedAt: nowIso(),
      })
      .where(eq(providerConfigs.id, id))
      .returning()
      .get();
    return row ? mapProviderConfig(row) : null;
  }

  /** Hard-delete a config row. Returns whether a row was removed. */
  delete(id: string): boolean {
    const row = this.db.delete(providerConfigs).where(eq(providerConfigs.id, id)).returning().get();
    return Boolean(row);
  }
}
