import { createHash } from "node:crypto";
import {
  AIProviderError,
  chunkText,
  type EmbeddingProvider,
  type Logger,
  type ProviderConfig,
  type SecretStore,
  type Storage,
} from "@sourdex/core";
import type {
  AiOutputRepository,
  CaptureRepository,
  ChunkRepository,
  ItemRepository,
} from "@sourdex/db";
import { createEmbeddingProvider } from "@sourdex/ai";
import type { ProviderFactoryOptions } from "@sourdex/ai";

/** Cap text fed to chunking so a single item can't produce an unbounded job (PRD §18). */
const MAX_EMBED_INPUT_CHARS = 200_000;
/** Embed in batches to bound request size. */
const EMBED_BATCH = 64;

export interface EmbeddingServiceDeps {
  providerConfigRepo: { list(): ProviderConfig[] };
  secrets: SecretStore;
  chunkRepo: ChunkRepository;
  aiOutputRepo: AiOutputRepository;
  itemRepo: ItemRepository;
  captureRepo: CaptureRepository;
  storage: Storage;
  createProvider?: (config: ProviderConfig, options: ProviderFactoryOptions) => EmbeddingProvider;
  logger?: Logger;
}

/**
 * Build chunk embeddings for an item (PRD §14.6). AI is opt-in: requires an enabled
 * provider that has an embedding model configured. Chunks + embeddings are rebuilt each
 * run (idempotent; supports model changes, §14.6 rule 5). Provider failures are swallowed
 * so semantic indexing never breaks full-text search or saving (PRD §5.2.3.7, §26.1);
 * only unexpected infrastructure errors propagate so the job can retry.
 */
export class EmbeddingService {
  constructor(private readonly deps: EmbeddingServiceDeps) {}

  /** First enabled provider that has an embedding model set, or null (semantic off). */
  enabledProvider(): ProviderConfig | null {
    return (
      this.deps.providerConfigRepo
        .list()
        .find((c) => c.enabled && (c.embeddingModel ?? "").trim().length > 0) ?? null
    );
  }

  /** Embed a search query with the enabled provider, or null when semantic is off. */
  async embedQuery(text: string): Promise<number[] | null> {
    const config = this.enabledProvider();
    if (!config) return null;
    const build = this.deps.createProvider ?? createEmbeddingProvider;
    const apiKey = (await this.deps.secrets.get(config.id)) ?? undefined;
    const provider = build(config, { apiKey });
    const { vectors } = await provider.embed({
      input: [text],
      model: config.embeddingModel ?? undefined,
    });
    return vectors[0] ?? null;
  }

  async embedItem(itemId: string): Promise<void> {
    const { chunkRepo, aiOutputRepo, itemRepo, secrets, logger } = this.deps;

    const config = this.enabledProvider();
    const item = itemRepo.findById(itemId);
    if (!item || !config) return;

    const text = (await this.readItemText(itemId))?.slice(0, MAX_EMBED_INPUT_CHARS);
    if (!text || !text.trim()) {
      logger?.warn("embedding skipped: no extracted text", { itemId });
      return;
    }

    const pieces = chunkText(text);
    if (pieces.length === 0) return;

    const build = this.deps.createProvider ?? createEmbeddingProvider;
    const apiKey = (await secrets.get(config.id)) ?? undefined;
    const provider = build(config, { apiKey });
    const model = config.embeddingModel ?? undefined;

    try {
      // Rebuild from scratch so re-embedding (e.g. after a model change) is idempotent.
      const stored = chunkRepo.replaceForItem(itemId, pieces);
      aiOutputRepo.deleteByItemAndType(itemId, "embedding");

      for (let start = 0; start < stored.length; start += EMBED_BATCH) {
        const batch = stored.slice(start, start + EMBED_BATCH);
        const { vectors, model: usedModel } = await provider.embed({
          input: batch.map((c) => c.text),
          model,
        });
        batch.forEach((chunk, i) => {
          const vector = vectors[i];
          if (!vector) return;
          aiOutputRepo.create({
            itemId,
            type: "embedding",
            provider: config.type,
            model: usedModel,
            inputHash: createHash("sha256").update(`${usedModel}\n${chunk.text}`).digest("hex"),
            output: JSON.stringify({ chunkId: chunk.id, vector }),
          });
        });
      }
    } catch (error) {
      if (!(error instanceof AIProviderError)) throw error; // infra error → retry
      logger?.warn("embedding generation failed", { itemId, error: error.message });
    }
  }

  private async readItemText(itemId: string): Promise<string | null> {
    const capture = this.deps.captureRepo.findByItemId(itemId);
    if (!capture?.originalTextPath) return null;
    try {
      return await this.deps.storage.readText(capture.originalTextPath);
    } catch {
      return null;
    }
  }
}
