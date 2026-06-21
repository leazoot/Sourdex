/** Background job domain types. Mirrors PRD §12.7 `jobs` and §10.5 commands. */

/** Job lifecycle status (PRD §12.7 `status`, default `pending`). */
export type JobStatus = "pending" | "running" | "completed" | "failed";

/**
 * Job command type (PRD §10.5).
 * v0.1 uses `extract_content`; the rest are reserved for v0.2+.
 */
export type JobType =
  | "extract_content"
  | "generate_summary"
  | "generate_embedding"
  | "export_markdown"
  | "detect_duplicate";

/** A persisted background job (PRD §12.7). */
export interface Job {
  id: string;
  type: JobType;
  /** Serialized JSON payload for the command. */
  payload: string;
  status: JobStatus;
  attempts: number;
  maxAttempts: number;
  error: string | null;
  /** ISO 8601 string. */
  createdAt: string;
  /** ISO 8601 string. */
  updatedAt: string;
  /** ISO 8601 string, set when execution starts. */
  startedAt: string | null;
  /** ISO 8601 string, set when execution finishes. */
  completedAt: string | null;
}
