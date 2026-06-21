import { createId, nowIso, type Job, type JobStatus, type JobType } from "@sourdex/core";
import { asc, eq } from "drizzle-orm";
import type { Db } from "../client.js";
import { jobs } from "../schema.js";
import { mapJob } from "../mappers.js";

/** Request to create a job. */
export interface CreateJobInput {
  type: JobType;
  payload: Record<string, unknown>;
  maxAttempts?: number;
}

/** Data access for background jobs (PRD §12.7, §10.5). */
export class JobRepository {
  constructor(private readonly db: Db) {}

  create(input: CreateJobInput): Job {
    const now = nowIso();
    const row = this.db
      .insert(jobs)
      .values({
        id: createId("job"),
        type: input.type,
        payload: JSON.stringify(input.payload),
        status: "pending",
        attempts: 0,
        maxAttempts: input.maxAttempts ?? 3,
        error: null,
        createdAt: now,
        updatedAt: now,
        startedAt: null,
        completedAt: null,
      })
      .returning()
      .get();
    return mapJob(row);
  }

  findById(id: string): Job | null {
    const row = this.db.select().from(jobs).where(eq(jobs.id, id)).get();
    return row ? mapJob(row) : null;
  }

  listByStatus(status: JobStatus): Job[] {
    const rows = this.db
      .select()
      .from(jobs)
      .where(eq(jobs.status, status))
      .orderBy(asc(jobs.createdAt))
      .all();
    return rows.map(mapJob);
  }

  /** Atomically claim the oldest pending job, marking it `running`. */
  claimNext(): Job | null {
    return this.db.transaction((tx) => {
      const next = tx
        .select()
        .from(jobs)
        .where(eq(jobs.status, "pending"))
        .orderBy(asc(jobs.createdAt))
        .limit(1)
        .get();
      if (!next) return null;

      const now = nowIso();
      const claimed = tx
        .update(jobs)
        .set({ status: "running", attempts: next.attempts + 1, startedAt: now, updatedAt: now })
        .where(eq(jobs.id, next.id))
        .returning()
        .get();
      return claimed ? mapJob(claimed) : null;
    });
  }

  markCompleted(id: string): void {
    const now = nowIso();
    this.db
      .update(jobs)
      .set({ status: "completed", completedAt: now, updatedAt: now, error: null })
      .where(eq(jobs.id, id))
      .run();
  }

  /**
   * Mark a job failed. If it still has attempts left it returns to `pending` for retry,
   * otherwise it terminates as `failed` (PRD §11.5 — record reason and retry count).
   */
  markFailed(id: string, error: string): void {
    const job = this.findById(id);
    if (!job) return;
    const exhausted = job.attempts >= job.maxAttempts;
    const now = nowIso();
    this.db
      .update(jobs)
      .set({
        status: exhausted ? "failed" : "pending",
        error,
        updatedAt: now,
        completedAt: exhausted ? now : null,
      })
      .where(eq(jobs.id, id))
      .run();
  }
}
