import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createMemoryDb, JobRepository, type SqliteDatabase } from "@sourdex/db";
import { JobWorker } from "./job-worker.js";

let sqlite: SqliteDatabase;
let jobs: JobRepository;
let worker: JobWorker;

beforeEach(() => {
  const mem = createMemoryDb();
  sqlite = mem.sqlite;
  jobs = new JobRepository(mem.db);
  worker = new JobWorker(jobs, { intervalMs: 10 });
});

afterEach(() => {
  worker.stop();
  sqlite.close();
});

describe("JobWorker", () => {
  it("runs a registered handler and completes the job", async () => {
    const seen: string[] = [];
    worker.register("extract_content", async (job) => {
      seen.push(job.id);
    });
    const job = jobs.create({ type: "extract_content", payload: { itemId: "item_1" } });

    expect(await worker.processOnce()).toBe(true);
    expect(seen).toEqual([job.id]);
    expect(jobs.findById(job.id)?.status).toBe("completed");
    expect(await worker.processOnce()).toBe(false); // queue drained
  });

  it("records an error and eventually fails a job with no registered handler", async () => {
    const job = jobs.create({ type: "extract_content", payload: {}, maxAttempts: 2 });

    await worker.processOnce(); // attempt 1 -> back to pending with error recorded
    expect(jobs.findById(job.id)?.status).toBe("pending");
    expect(jobs.findById(job.id)?.error).toContain("No handler");

    await worker.processOnce(); // attempt 2 -> failed (exhausted)
    expect(jobs.findById(job.id)?.status).toBe("failed");
  });

  it("returns a throwing job to pending while attempts remain", async () => {
    worker.register("extract_content", async () => {
      throw new Error("boom");
    });
    const job = jobs.create({ type: "extract_content", payload: {}, maxAttempts: 2 });

    await worker.processOnce(); // attempt 1 -> pending again
    expect(jobs.findById(job.id)?.status).toBe("pending");
    expect(jobs.findById(job.id)?.error).toBe("boom");

    await worker.processOnce(); // attempt 2 -> failed (exhausted)
    expect(jobs.findById(job.id)?.status).toBe("failed");
  });
});
