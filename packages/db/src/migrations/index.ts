import { migration0000 } from "./0000_init.js";

/** A single ordered, idempotent SQL migration. */
export interface Migration {
  name: string;
  sql: string;
}

/** Ordered migration list applied by the runner. Append new migrations; never edit applied ones. */
export const MIGRATIONS: Migration[] = [migration0000];
