/** Time helpers. All persisted timestamps are ISO 8601 UTC strings (PRD §12). */

/** Current time as an ISO 8601 string. */
export function nowIso(): string {
  return new Date().toISOString();
}
