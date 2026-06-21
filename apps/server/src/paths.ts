import { mkdirSync } from "node:fs";
import { join } from "node:path";

/** Data directory layout (PRD §16.1). `files/text` holds original/selected text captures. */
export const DATA_SUBDIRS = [
  "files/raw-html",
  "files/readable-html",
  "files/markdown",
  "files/text",
  "files/screenshots",
  "files/exports",
  "logs",
  "backups",
  "config",
] as const;

/** Create the data directory and all required subdirectories (idempotent). */
export function ensureDataDirs(dataDir: string): void {
  mkdirSync(dataDir, { recursive: true });
  for (const sub of DATA_SUBDIRS) {
    mkdirSync(join(dataDir, sub), { recursive: true });
  }
}
