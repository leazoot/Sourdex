import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { ValidationError } from "@sourdex/core";
import { LocalStorage } from "./local-storage.js";

let root: string;
let storage: LocalStorage;

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), "sourdex-storage-"));
  storage = new LocalStorage(root);
});

afterEach(() => {
  rmSync(root, { recursive: true, force: true });
});

describe("LocalStorage", () => {
  it("writes and reads text, creating parent dirs", async () => {
    const rel = await storage.write("files/raw-html/a.html", "<h1>hi</h1>");
    expect(rel).toBe("files/raw-html/a.html");
    expect(await storage.readText("files/raw-html/a.html")).toBe("<h1>hi</h1>");
  });

  it("reports existence and removes files (idempotent remove)", async () => {
    await storage.write("files/text/x.txt", "data");
    expect(await storage.exists("files/text/x.txt")).toBe(true);
    await storage.remove("files/text/x.txt");
    expect(await storage.exists("files/text/x.txt")).toBe(false);
    await storage.remove("files/text/x.txt"); // no throw on missing
  });

  it("rejects path traversal outside the root", async () => {
    await expect(storage.write("../escape.txt", "x")).rejects.toBeInstanceOf(ValidationError);
  });
});
