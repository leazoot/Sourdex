import { createId, nowIso, type AiOutput, type AiOutputType } from "@sourdex/core";
import { and, desc, eq, sql } from "drizzle-orm";
import type { Db } from "../client.js";
import { aiOutputs } from "../schema.js";
import { mapAiOutput } from "../mappers.js";

/** Request to store an AI output (PRD §12.8). `output` is serialized JSON. */
export interface CreateAiOutputInput {
  itemId: string | null;
  type: AiOutputType;
  provider: string;
  model: string;
  inputHash: string;
  output: string;
}

/**
 * Data access for stored, reproducible AI outputs (PRD §12.8). Outputs are append-only
 * and keyed by input hash so a given input maps to a cacheable result.
 */
export class AiOutputRepository {
  constructor(private readonly db: Db) {}

  create(input: CreateAiOutputInput): AiOutput {
    const row = this.db
      .insert(aiOutputs)
      .values({
        id: createId("ao"),
        itemId: input.itemId,
        type: input.type,
        provider: input.provider,
        model: input.model,
        inputHash: input.inputHash,
        output: input.output,
        createdAt: nowIso(),
      })
      .returning()
      .get();
    return mapAiOutput(row);
  }

  /** Latest output of a kind for an item (most recent by creation), or null. */
  findLatestByItem(itemId: string, type: AiOutputType): AiOutput | null {
    const row = this.db
      .select()
      .from(aiOutputs)
      .where(and(eq(aiOutputs.itemId, itemId), eq(aiOutputs.type, type)))
      // createdAt may collide within a millisecond; rowid breaks ties by insert order.
      .orderBy(desc(aiOutputs.createdAt), desc(sql`rowid`))
      .limit(1)
      .get();
    return row ? mapAiOutput(row) : null;
  }
}
