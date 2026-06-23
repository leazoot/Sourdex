import type { Migration } from "./index.js";

/**
 * Add `captures.content_kind` for the faithful-capture tiers (article | fulltext | none),
 * see docs/15_PROPOSAL_FAITHFUL_CAPTURE. Existing successful captures predate the field and
 * were all Tier 1 articles, so backfill them as `article`; failed/pending rows stay null.
 *
 * Idempotent at the runner level (applied once, tracked by name). Each statement runs in the
 * migration transaction.
 */
export const migration0001: Migration = {
  name: "0001_capture_content_kind",
  sql: `
ALTER TABLE captures ADD COLUMN content_kind TEXT;

UPDATE captures SET content_kind = 'article'
  WHERE content_kind IS NULL AND extraction_status = 'success';
`,
};
