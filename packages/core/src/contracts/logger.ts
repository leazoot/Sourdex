/** Logging contract (PRD §9.3, §11.6, §17). Implemented in packages/logger.
 *
 * Implementations MUST NOT log user content or API keys (PRD §11.6, §17.1).
 * Error logs should carry a request_id / job_id via `meta` for traceability.
 */
export type LogLevel = "debug" | "info" | "warn" | "error";

/** Structured, non-sensitive log metadata. */
export type LogMeta = Record<string, unknown>;

export interface Logger {
  debug(message: string, meta?: LogMeta): void;
  info(message: string, meta?: LogMeta): void;
  warn(message: string, meta?: LogMeta): void;
  error(message: string, meta?: LogMeta): void;
}
