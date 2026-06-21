import type { Job, JobType, Logger } from "@sourdex/core";
import type { JobRepository } from "@sourdex/db";

/** Handles one job of a given type. Throwing marks the job failed (with retry). */
export type JobHandler = (job: Job) => Promise<void>;

/**
 * In-process job worker backed by the `jobs` table (decision OQ-03, PRD §10.5, §12.7).
 * Polls for pending jobs and dispatches to registered handlers. Save flow is never
 * blocked by this worker (PRD §18.1) — it runs independently.
 */
export class JobWorker {
  private readonly handlers = new Map<JobType, JobHandler>();
  private timer: NodeJS.Timeout | undefined;
  private running = false;

  constructor(
    private readonly jobs: JobRepository,
    private readonly options: { intervalMs?: number; logger?: Logger } = {},
  ) {}

  register(type: JobType, handler: JobHandler): void {
    this.handlers.set(type, handler);
  }

  /** Process the next pending job, if any. Returns true if a job was handled. */
  async processOnce(): Promise<boolean> {
    const job = this.jobs.claimNext();
    if (!job) return false;

    const handler = this.handlers.get(job.type);
    if (!handler) {
      this.jobs.markFailed(job.id, `No handler registered for job type: ${job.type}`);
      return true;
    }

    try {
      await handler(job);
      this.jobs.markCompleted(job.id);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.options.logger?.warn("job failed", { jobId: job.id, type: job.type });
      this.jobs.markFailed(job.id, message);
    }
    return true;
  }

  /** Start polling. Drains all pending jobs each tick, then waits `intervalMs`. */
  start(): void {
    if (this.running) return;
    this.running = true;
    const interval = this.options.intervalMs ?? 1000;
    const tick = async (): Promise<void> => {
      if (!this.running) return;
      try {
        while (await this.processOnce()) {
          // drain queue
        }
      } catch (error) {
        this.options.logger?.error("job worker tick failed", {
          message: error instanceof Error ? error.message : String(error),
        });
      }
      if (this.running) this.timer = setTimeout(() => void tick(), interval);
    };
    void tick();
  }

  stop(): void {
    this.running = false;
    if (this.timer) clearTimeout(this.timer);
    this.timer = undefined;
  }
}
