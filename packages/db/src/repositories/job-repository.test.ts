import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createMemoryDb } from "../testing.js";
import type { Db, SqliteDatabase } from "../client.js";
import { JobRepository } from "./job-repository.js";

let sqlite: SqliteDatabase;
let db: Db;
let repo: JobRepository;

beforeEach(() => {
  ({ sqlite, db } = createMemoryDb());
  repo = new JobRepository(db);
});

afterEach(() => {
  sqlite.close();
});

describe("JobRepository", () => {
  it("creates a pending job with a serialized payload", () => {
    const job = repo.create({ type: "extract_content", payload: { itemId: "item_1" } });
    expect(job.id).toMatch(/^job_/);
    expect(job.status).toBe("pending");
    expect(JSON.parse(job.payload)).toEqual({ itemId: "item_1" });
  });

  it("claims the oldest pending job and marks it running with an attempt", () => {
    repo.create({ type: "extract_content", payload: { n: 1 } });
    const claimed = repo.claimNext();
    expect(claimed?.status).toBe("running");
    expect(claimed?.attempts).toBe(1);
    expect(repo.claimNext()).toBeNull(); // nothing left pending
  });

  it("completes a job", () => {
    const job = repo.create({ type: "extract_content", payload: {} });
    repo.markCompleted(job.id);
    expect(repo.findById(job.id)?.status).toBe("completed");
  });

  it("returns a job to pending while attempts remain, then fails when exhausted", () => {
    const job = repo.create({ type: "extract_content", payload: {}, maxAttempts: 2 });

    repo.claimNext(); // attempts -> 1
    repo.markFailed(job.id, "boom");
    expect(repo.findById(job.id)?.status).toBe("pending");

    repo.claimNext(); // attempts -> 2
    repo.markFailed(job.id, "boom again");
    const final = repo.findById(job.id);
    expect(final?.status).toBe("failed");
    expect(final?.error).toBe("boom again");
  });
});
