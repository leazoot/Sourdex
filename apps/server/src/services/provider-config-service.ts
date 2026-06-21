import {
  AIProviderError,
  NotFoundError,
  type LLMProvider,
  type ProviderConfig,
  type SecretStore,
} from "@sourdex/core";
import type {
  CreateProviderConfigInput,
  ProviderConfigRepository,
  UpdateProviderConfigInput,
} from "@sourdex/db";
import { createLLMProvider, type ProviderFactoryOptions } from "@sourdex/ai";

/** Provider config plus whether an API key is stored — never includes the key itself. */
export interface ProviderConfigView extends ProviderConfig {
  hasApiKey: boolean;
}

export interface CreateProviderInput extends CreateProviderConfigInput {
  /** Plaintext API key to store in the SecretStore (optional; e.g. Ollama needs none). */
  apiKey?: string;
}

export interface UpdateProviderInput extends UpdateProviderConfigInput {
  /** `string` replaces the stored key, `null` clears it, `undefined` leaves it unchanged. */
  apiKey?: string | null;
}

export interface ProviderConfigServiceDeps {
  repo: ProviderConfigRepository;
  secrets: SecretStore;
  /** Factory for building a provider (DI for test-connection); defaults to @sourdex/ai. */
  createProvider?: (config: ProviderConfig, options: ProviderFactoryOptions) => LLMProvider;
}

/**
 * Manage AI provider configs and their secret keys (PRD §12.9, §17.2).
 * Config rows are stored via the repository; API keys live only in the SecretStore,
 * keyed by config id, and are never returned to callers.
 */
export class ProviderConfigService {
  private readonly repo: ProviderConfigRepository;
  private readonly secrets: SecretStore;
  private readonly createProvider: (
    config: ProviderConfig,
    options: ProviderFactoryOptions,
  ) => LLMProvider;

  constructor(deps: ProviderConfigServiceDeps) {
    this.repo = deps.repo;
    this.secrets = deps.secrets;
    this.createProvider = deps.createProvider ?? createLLMProvider;
  }

  async list(): Promise<ProviderConfigView[]> {
    const configs = this.repo.list();
    const views: ProviderConfigView[] = [];
    for (const config of configs) {
      views.push({ ...config, hasApiKey: await this.secrets.has(config.id) });
    }
    return views;
  }

  async get(id: string): Promise<ProviderConfigView | null> {
    const config = this.repo.findById(id);
    if (!config) return null;
    return { ...config, hasApiKey: await this.secrets.has(config.id) };
  }

  async create(input: CreateProviderInput): Promise<ProviderConfigView> {
    const { apiKey, ...configInput } = input;
    const config = this.repo.create(configInput);
    if (apiKey) await this.secrets.set(config.id, apiKey);
    return { ...config, hasApiKey: Boolean(apiKey) };
  }

  async update(id: string, patch: UpdateProviderInput): Promise<ProviderConfigView | null> {
    const { apiKey, ...configPatch } = patch;
    const config = this.repo.update(id, configPatch);
    if (!config) return null;
    if (apiKey === null) await this.secrets.delete(id);
    else if (apiKey !== undefined) await this.secrets.set(id, apiKey);
    return { ...config, hasApiKey: await this.secrets.has(id) };
  }

  async remove(id: string): Promise<boolean> {
    const deleted = this.repo.delete(id);
    if (deleted) await this.secrets.delete(id);
    return deleted;
  }

  /**
   * Verify a provider is reachable with its stored key by sending a minimal chat ping.
   * Throws NotFoundError if the config is missing, AIProviderError if the call fails.
   */
  async testConnection(id: string): Promise<{ ok: true; model: string }> {
    const config = this.repo.findById(id);
    if (!config) throw new NotFoundError(`Provider config ${id} not found`);
    const apiKey = (await this.secrets.get(id)) ?? undefined;
    const provider = this.createProvider(config, { apiKey });
    const result = await provider.chat({
      messages: [{ role: "user", content: "ping" }],
    });
    if (!result.content) throw new AIProviderError("Provider returned an empty response");
    return { ok: true, model: result.model };
  }
}
