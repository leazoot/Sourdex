import { createHash } from "node:crypto";
import {
  AIProviderError,
  type LLMProvider,
  type Logger,
  type ProviderConfig,
  type SecretStore,
  type Storage,
} from "@sourdex/core";
import type {
  AiOutputRepository,
  CaptureRepository,
  ItemRepository,
  SearchRepository,
  TagRepository,
} from "@sourdex/db";
import { buildSummaryMessages, createLLMProvider, parseSummaryOutput } from "@sourdex/ai";
import type { ProviderFactoryOptions } from "@sourdex/ai";
import type { AutoTagService } from "./auto-tag-service.js";

/** Cap the text sent to the model so prompts stay bounded (PRD §18, §17.1). */
const MAX_SUMMARY_INPUT_CHARS = 12_000;

export interface SummaryServiceDeps {
  providerConfigRepo: { list(): ProviderConfig[] };
  secrets: SecretStore;
  aiOutputRepo: AiOutputRepository;
  itemRepo: ItemRepository;
  captureRepo: CaptureRepository;
  tagRepo: TagRepository;
  searchRepo: SearchRepository;
  storage: Storage;
  autoTagService?: AutoTagService;
  createProvider?: (config: ProviderConfig, options: ProviderFactoryOptions) => LLMProvider;
  logger?: Logger;
}

/**
 * Generate a structured summary for an item using the user's enabled AI provider
 * (PRD §14.3). AI is opt-in: if no provider is enabled the item is left unsummarized.
 * Provider/parse failures mark the item's ai_status `failed` and never throw into the
 * caller — AI must not break saving, reading or search (PRD §14.1, §26.1). Only
 * unexpected infrastructure errors propagate so the job can retry.
 */
export class SummaryService {
  constructor(private readonly deps: SummaryServiceDeps) {}

  /** The first enabled provider config, or null when AI is effectively off. */
  enabledProvider(): ProviderConfig | null {
    return this.deps.providerConfigRepo.list().find((c) => c.enabled) ?? null;
  }

  async summarizeItem(itemId: string): Promise<void> {
    const { itemRepo, aiOutputRepo, searchRepo, tagRepo, secrets, logger } = this.deps;

    const config = this.enabledProvider();
    const item = itemRepo.findById(itemId);
    if (!item) return;
    if (!config) {
      itemRepo.setAiStatus(itemId, "none");
      return;
    }

    const text = await this.readItemText(itemId);
    if (!text || !text.trim()) {
      itemRepo.setAiStatus(itemId, "failed");
      logger?.warn("summary skipped: no extracted text", { itemId });
      return;
    }

    const build = this.deps.createProvider ?? createLLMProvider;
    const apiKey = (await secrets.get(config.id)) ?? undefined;
    const provider = build(config, { apiKey });
    const clipped = text.slice(0, MAX_SUMMARY_INPUT_CHARS);

    try {
      const result = await provider.chat({
        messages: buildSummaryMessages({ title: item.title, text: clipped }),
      });
      const summary = parseSummaryOutput(result.content);

      aiOutputRepo.create({
        itemId,
        type: "summary",
        provider: config.type,
        model: result.model,
        inputHash: createHash("sha256").update(`${result.model}\n${clipped}`).digest("hex"),
        output: JSON.stringify(summary),
      });
      itemRepo.applyAiSummary(itemId, {
        summary: summary.summary,
        oneSentence: summary.oneSentence,
      });

      // Auto-tag from the same model output — no extra LLM call (PRD §14.4). Tagging
      // must never undo an already-successful summary, so failures are swallowed.
      if (this.deps.autoTagService) {
        try {
          this.deps.autoTagService.applySuggestedTags(itemId, summary.suggestedTags, {
            provider: config.type,
            model: result.model,
          });
        } catch (error) {
          logger?.warn("auto-tag failed", { itemId, error: (error as Error).message });
        }
      }

      // Re-index so the summary (and any new tags) become searchable (PRD §15.2).
      const tags = tagRepo
        .listByItem(itemId)
        .map((t) => t.name)
        .join(" ");
      searchRepo.index({
        itemId,
        title: item.title,
        plainText: text,
        summary: summary.summary,
        tags,
      });
    } catch (error) {
      if (!(error instanceof AIProviderError)) throw error; // infra error → retry
      itemRepo.setAiStatus(itemId, "failed");
      logger?.warn("summary generation failed", { itemId, error: error.message });
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
