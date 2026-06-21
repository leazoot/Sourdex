import { createHash } from "node:crypto";
import {
  type AskCitation,
  type AskResult,
  type AskScope,
  type LLMProvider,
  type Logger,
  type ProviderConfig,
  type SecretStore,
  type SourceType,
} from "@sourdex/core";
import type {
  AiOutputRepository,
  ChunkRepository,
  ItemRepository,
  SearchRepository,
  TagRepository,
} from "@sourdex/db";
import { buildAnswerMessages, createLLMProvider, parseAnswerOutput } from "@sourdex/ai";
import type { AnswerContext, ProviderFactoryOptions } from "@sourdex/ai";
import { buildMatchExpression, tokenizeQuery } from "@sourdex/search";
import type { SemanticSearchService } from "./semantic-search-service.js";

const MAX_CONTEXTS = 6;
const CANDIDATES = 20;
const MAX_CONTEXT_CHARS = 1500;
/** Shown when the saved sources don't support an answer (PRD §5.2.4 rule 3). */
const INSUFFICIENT = "The saved sources don't contain enough information to answer this.";

interface Evidence {
  itemId: string;
  chunkId: string;
  title: string;
  url: string | null;
  text: string;
  score: number;
  semantic: boolean;
}

export interface AskServiceDeps {
  providerConfigRepo: { list(): ProviderConfig[] };
  secrets: SecretStore;
  searchRepo: SearchRepository;
  semanticSearchService: SemanticSearchService;
  chunkRepo: ChunkRepository;
  itemRepo: ItemRepository;
  tagRepo: TagRepository;
  aiOutputRepo: AiOutputRepository;
  createProvider?: (config: ProviderConfig, options: ProviderFactoryOptions) => LLMProvider;
  logger?: Logger;
}

/**
 * Retrieval-augmented Q&A over the user's own saved sources (PRD §5.2.4, §14.5). Retrieves
 * evidence chunks (semantic + keyword), asks the LLM to answer using only those numbered
 * passages, then validates every citation against the retrieved chunks. Answers without a
 * valid citation are not surfaced — the user gets an explicit "insufficient evidence"
 * result instead, so the model can never present uncited or fabricated claims
 * (PRD §14.5 rules 1–5, §5.2.4 acceptance 1–2). AI is opt-in.
 */
export class AskService {
  constructor(private readonly deps: AskServiceDeps) {}

  /** First enabled provider (used for chat), or null when AI is off. */
  enabledProvider(): ProviderConfig | null {
    return this.deps.providerConfigRepo.list().find((c) => c.enabled) ?? null;
  }

  async ask(question: string, scope: AskScope = {}): Promise<AskResult> {
    const config = this.enabledProvider();
    if (!config || !question.trim()) return insufficient();

    const evidence = await this.retrieve(question, scope);
    if (evidence.length === 0) return this.record(question, config, insufficient());

    const contexts: AnswerContext[] = evidence.map((e, i) => ({
      n: i + 1,
      title: e.title,
      text: e.text.slice(0, MAX_CONTEXT_CHARS),
    }));

    const build = this.deps.createProvider ?? createLLMProvider;
    const apiKey = (await this.deps.secrets.get(config.id)) ?? undefined;
    const provider = build(config, { apiKey });

    const result = await provider.chat({ messages: buildAnswerMessages({ question, contexts }) });
    const parsed = parseAnswerOutput(result.content);

    const citations = this.validateCitations(parsed.citations, evidence);
    // No valid citation ⇒ do not surface a possibly-uncited answer (PRD §14.5 rule 1).
    if (citations.length === 0) return this.record(question, config, insufficient());

    return this.record(question, config, {
      answer: parsed.answer,
      citations,
      confidence: parsed.confidence,
    });
  }

  /** Retrieve and rank candidate evidence chunks (semantic first, then keyword). */
  private async retrieve(question: string, scope: AskScope): Promise<Evidence[]> {
    const byChunk = new Map<string, Evidence>();

    if (this.deps.semanticSearchService.enabledProvider()) {
      const hits = await this.deps.semanticSearchService.search(question, { limit: CANDIDATES });
      for (const hit of hits) {
        if (!this.inScope(hit.itemId, hit.type, scope)) continue;
        const text = this.deps.chunkRepo.findById(hit.chunkId)?.text ?? hit.snippet;
        byChunk.set(hit.chunkId, {
          itemId: hit.itemId,
          chunkId: hit.chunkId,
          title: hit.title,
          url: hit.url,
          text,
          score: hit.score,
          semantic: true,
        });
      }
    }

    const match = buildMatchExpression(question);
    if (match) {
      const tokens = tokenizeQuery(question);
      const rows = this.deps.searchRepo.queryItems(
        match,
        { type: scope.type && scope.type !== "all" ? scope.type : undefined },
        { limit: CANDIDATES, offset: 0, sort: "relevance" },
      );
      for (const row of rows) {
        if (!this.inScope(row.itemId, row.type, scope)) continue;
        const best = this.bestChunk(row.itemId, tokens);
        if (!best || byChunk.has(best.id)) continue;
        byChunk.set(best.id, {
          itemId: row.itemId,
          chunkId: best.id,
          title: row.title,
          url: row.url,
          text: best.text,
          score: best.overlap,
          semantic: false,
        });
      }
    }

    return [...byChunk.values()]
      .sort((a, b) => {
        if (a.semantic !== b.semantic) return a.semantic ? -1 : 1;
        return b.score - a.score;
      })
      .slice(0, MAX_CONTEXTS);
  }

  /** Best-matching chunk of an item by query-token overlap, or null if it has no chunks. */
  private bestChunk(
    itemId: string,
    tokens: string[],
  ): { id: string; text: string; overlap: number } | null {
    const chunks = this.deps.chunkRepo.listByItem(itemId);
    if (chunks.length === 0) return null;
    let best = { id: chunks[0]!.id, text: chunks[0]!.text, overlap: -1 };
    for (const chunk of chunks) {
      const lower = chunk.text.toLowerCase();
      const overlap = tokens.reduce(
        (n, t) => (t && lower.includes(t.toLowerCase()) ? n + 1 : n),
        0,
      );
      if (overlap > best.overlap) best = { id: chunk.id, text: chunk.text, overlap };
    }
    return best;
  }

  /** Keep only citations that point at a retrieved chunk; map to validated AskCitations. */
  private validateCitations(
    raw: { n: number; quote: string }[],
    evidence: Evidence[],
  ): AskCitation[] {
    const seen = new Set<number>();
    const out: AskCitation[] = [];
    for (const c of raw) {
      const e = evidence[c.n - 1];
      if (!e || seen.has(c.n)) continue;
      seen.add(c.n);
      out.push({
        n: c.n,
        itemId: e.itemId,
        chunkId: e.chunkId,
        title: e.title,
        url: e.url,
        quote: c.quote.trim() || e.text.slice(0, 200),
      });
    }
    return out;
  }

  private inScope(itemId: string, type: SourceType, scope: AskScope): boolean {
    if (scope.type && scope.type !== "all" && type !== scope.type) return false;
    if (scope.itemIds && scope.itemIds.length > 0 && !scope.itemIds.includes(itemId)) return false;
    if (scope.tagIds && scope.tagIds.length > 0) {
      const tagIds = new Set(this.deps.tagRepo.listByItem(itemId).map((t) => t.id));
      if (!scope.tagIds.some((id) => tagIds.has(id))) return false;
    }
    return true;
  }

  private record(question: string, config: ProviderConfig, result: AskResult): AskResult {
    try {
      this.deps.aiOutputRepo.create({
        itemId: null,
        type: "answer",
        provider: config.type,
        model: config.chatModel ?? config.type,
        inputHash: createHash("sha256").update(question).digest("hex"),
        output: JSON.stringify(result),
      });
    } catch (error) {
      this.deps.logger?.warn("failed to record ask output", {
        error: (error as Error).message,
      });
    }
    return result;
  }
}

function insufficient(): AskResult {
  return { answer: INSUFFICIENT, citations: [], confidence: "low" };
}
