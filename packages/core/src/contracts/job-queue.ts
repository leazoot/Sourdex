/** Background job queue contract (PRD §9.3, §10.5). Implemented in apps/server. */

import type { JobType } from "../types/job.js";

/** A request to enqueue a background job. */
export interface JobInput {
  type: JobType;
  /** Structured command payload; serialized by the queue implementation. */
  payload: Record<string, unknown>;
  maxAttempts?: number;
}

/** Queue facade used by services. v0.1: in-process poller backed by the `jobs` table. */
export interface JobQueue {
  /** Enqueue a job and return its id. */
  enqueue(input: JobInput): Promise<string>;
}
