import { createHash } from "node:crypto";
import type { Logger, Tag } from "@sourdex/core";
import type { AiOutputRepository, TagRepository } from "@sourdex/db";
import { normalizeTagName } from "@sourdex/db";

/**
 * Tags too generic to carry signal (PRD §14.4 rule 6). Compared after normalization
 * (lowercase, trimmed). Kept deliberately small — the goal is to reject obvious noise,
 * not to police vocabulary.
 */
const GENERIC_TAGS = new Set([
  "文章",
  "资料",
  "内容",
  "笔记",
  "文档",
  "网页",
  "信息",
  "知识",
  "article",
  "content",
  "note",
  "notes",
  "document",
  "page",
  "misc",
  "other",
  "general",
  "stuff",
  "info",
]);

const MAX_TAG_LENGTH = 20; // PRD §14.4 rule 4
const MAX_NEW_TAGS = 3; // PRD §14.4 rule 2
const MAX_TAGS_PER_ITEM = 7; // PRD §14.4 rule 3

export interface AutoTagServiceDeps {
  tagRepo: TagRepository;
  aiOutputRepo: AiOutputRepository;
  logger?: Logger;
}

interface Candidate {
  name: string;
  normalized: string;
}

/**
 * Apply AI-suggested tags to an item under the PRD §14.4 strategy: normalize, drop
 * empty/over-length/generic, prefer reusing existing tags over creating new ones,
 * cap new tags (3) and total tags per item (7). Manual tags keep priority — existing
 * tags (manual or AI) occupy slots first and are never removed. AI is opt-in and must
 * not break the save/read/search loop, so tagging failures are surfaced via the caller
 * and never undo an already-successful summary.
 */
export class AutoTagService {
  constructor(private readonly deps: AutoTagServiceDeps) {}

  applySuggestedTags(
    itemId: string,
    suggested: readonly string[],
    meta: { provider: string; model: string },
  ): Tag[] {
    const { tagRepo, aiOutputRepo } = this.deps;

    const candidates = this.normalizeCandidates(suggested);
    if (candidates.length === 0) return [];

    // Existing item tags count toward the cap and keep priority (never removed).
    const existing = tagRepo.listByItem(itemId);
    const existingNames = new Set(existing.map((t) => t.normalizedName));
    const slots = MAX_TAGS_PER_ITEM - existing.length;
    if (slots <= 0) return [];

    // Reuse existing global tags before minting new ones (PRD §14.4 rule 1).
    const fresh = candidates.filter((c) => !existingNames.has(c.normalized));
    const reuse: Candidate[] = [];
    const create: Candidate[] = [];
    for (const c of fresh) {
      (tagRepo.findByNormalizedName(c.normalized) ? reuse : create).push(c);
    }
    const ordered = [...reuse, ...create.slice(0, MAX_NEW_TAGS)].slice(0, slots);

    const applied: Tag[] = [];
    for (const c of ordered) {
      const tag = tagRepo.upsert(c.name, "ai");
      tagRepo.attachToItem(itemId, tag.id, { source: "ai", confidence: null });
      applied.push(tag);
    }

    if (applied.length > 0) {
      aiOutputRepo.create({
        itemId,
        type: "tags",
        provider: meta.provider,
        model: meta.model,
        inputHash: createHash("sha256")
          .update(applied.map((t) => t.name).join("\n"))
          .digest("hex"),
        output: JSON.stringify({ tags: applied.map((t) => t.name) }),
      });
    }
    return applied;
  }

  private normalizeCandidates(suggested: readonly string[]): Candidate[] {
    const seen = new Set<string>();
    const out: Candidate[] = [];
    for (const raw of suggested) {
      if (typeof raw !== "string") continue;
      const name = raw.trim().replace(/\s+/g, " ");
      const normalized = normalizeTagName(name);
      if (!normalized || normalized.length > MAX_TAG_LENGTH) continue;
      if (GENERIC_TAGS.has(normalized) || seen.has(normalized)) continue;
      seen.add(normalized);
      out.push({ name, normalized });
    }
    return out;
  }
}
