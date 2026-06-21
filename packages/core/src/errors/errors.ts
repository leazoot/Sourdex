/**
 * Sourdex error types (PRD §11.5).
 *
 * Rules: don't swallow errors; don't leak low-level errors to the UI; user-facing
 * errors must be readable; developer errors must be traceable. Each error carries a
 * stable `code` for programmatic handling and preserves the underlying `cause`.
 */

/** Base class for all Sourdex domain errors. */
export class SourdexError extends Error {
  /** Stable, machine-readable error code. */
  readonly code: string;

  constructor(message: string, code: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = new.target.name;
    this.code = code;
    // Maintain a proper prototype chain when targeting ES2022 + transpilation.
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/** Failure while capturing/saving a source (PRD §11.5). */
export class CaptureError extends SourdexError {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, "CAPTURE_ERROR", options);
  }
}

/** Failure while extracting readable content from a capture (PRD §11.5, §26.1). */
export class ExtractionError extends SourdexError {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, "EXTRACTION_ERROR", options);
  }
}

/** Failure when calling an AI provider (PRD §11.5). */
export class AIProviderError extends SourdexError {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, "AI_PROVIDER_ERROR", options);
  }
}

/** Failure at the database / persistence layer (PRD §11.5). */
export class DatabaseError extends SourdexError {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, "DATABASE_ERROR", options);
  }
}

/** A requested resource does not exist. */
export class NotFoundError extends SourdexError {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, "NOT_FOUND", options);
  }
}

/** Invalid input that failed validation before reaching the domain. */
export class ValidationError extends SourdexError {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, "VALIDATION_ERROR", options);
  }
}

/** Type guard for Sourdex domain errors. */
export function isSourdexError(value: unknown): value is SourdexError {
  return value instanceof SourdexError;
}
