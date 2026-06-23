/** A single ordered, idempotent SQL migration. */
export interface Migration {
  name: string;
  sql: string;
}

import { migration0000 } from "./0000_init.js";
import { migration0001 } from "./0001_capture_content_kind.js";

/** Ordered migration list applied by the runner. Append new migrations; never edit applied ones. */
export const MIGRATIONS: Migration[] = [migration0000, migration0001];
