import { access, mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import { dirname, isAbsolute, join, normalize } from "node:path";
import { ValidationError, type Storage } from "@sourdex/core";

/**
 * Local filesystem implementation of the `Storage` contract (PRD §16.1).
 * All paths are relative to the data directory root and validated to prevent
 * path traversal outside the root (PRD §17 security boundary).
 */
export class LocalStorage implements Storage {
  constructor(private readonly root: string) {}

  private resolve(relativePath: string): string {
    const normalized = normalize(relativePath);
    if (isAbsolute(normalized) || normalized.startsWith("..")) {
      throw new ValidationError(`Unsafe storage path: ${relativePath}`);
    }
    return join(this.root, normalized);
  }

  async write(relativePath: string, data: string | Uint8Array): Promise<string> {
    const target = this.resolve(relativePath);
    await mkdir(dirname(target), { recursive: true });
    await writeFile(target, data);
    return relativePath;
  }

  async readText(relativePath: string): Promise<string> {
    return readFile(this.resolve(relativePath), "utf8");
  }

  async readBytes(relativePath: string): Promise<Uint8Array> {
    return new Uint8Array(await readFile(this.resolve(relativePath)));
  }

  async exists(relativePath: string): Promise<boolean> {
    try {
      await access(this.resolve(relativePath));
      return true;
    } catch {
      return false;
    }
  }

  async remove(relativePath: string): Promise<void> {
    try {
      await unlink(this.resolve(relativePath));
    } catch {
      // Removing an already-absent file is a no-op (contract requirement).
    }
  }
}
