/** Local file storage contract (PRD §9.3, §16.1). Implemented in apps/server.
 *
 * Paths are relative to the configured data directory so they stay migratable
 * (PRD §5.1.3). Uses Uint8Array (not Node Buffer) to remain runtime-agnostic.
 */
export interface Storage {
  /** Write data to a relative path; returns the stored relative path. */
  write(relativePath: string, data: string | Uint8Array): Promise<string>;
  readText(relativePath: string): Promise<string>;
  readBytes(relativePath: string): Promise<Uint8Array>;
  exists(relativePath: string): Promise<boolean>;
  /** Remove a file. Must not throw if the file is already absent. */
  remove(relativePath: string): Promise<void>;
}
