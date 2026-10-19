import { asc, eq } from "drizzle-orm";
import type { CreateJobBody, JobResult } from "@/lib/contract/job";
import { formatLogTimestamp } from "@/lib/pipeline";
import type { PipelineStageId } from "@/lib/types";
import { getDb, schema } from "./db";
import { emitJobEvent } from "./events";

const MAX_LOGS = 200;

export function appendJobLog(jobId: string, message: string) {
  const db = getDb();
  const id = crypto.randomUUID();
  const ts = formatLogTimestamp();
  const createdAt = new Date();

  db.insert(schema.jobLogs).values({ id, jobId, ts, message, createdAt }).run();
  emitJobEvent(jobId, { type: "log", id, ts, message });

  const rows = db
    .select({ id: schema.jobLogs.id })
    .from(schema.jobLogs)
    .where(eq(schema.jobLogs.jobId, jobId))
    .all();
  if (rows.length > MAX_LOGS) {
    const toDelete = rows.slice(0, rows.length - MAX_LOGS).map((r) => r.id);
    for (const logId of toDelete) {
      db.delete(schema.jobLogs).where(eq(schema.jobLogs.id, logId)).run();
    }
  }
}

export function updateJobStage(
  jobId: string,
  stageId: PipelineStageId,
  status: "running" | "done",
  progress: number,
) {
  const db = getDb();
  db.update(schema.jobs)
    .set({
      currentStage: stageId,
      progress,
      updatedAt: new Date(),
    })
    .where(eq(schema.jobs.id, jobId))
    .run();

  emitJobEvent(jobId, {
    type: "stage",
    stageId,
    status,
    progress,
  });
}

export function completeJob(
  jobId: string,
  result: JobResult,
  copyRevision: number,
) {
  const db = getDb();
  db.update(schema.jobs)
    .set({
      status: "completed",
      progress: 100,
      currentStage: null,
      resultJson: JSON.stringify(result),
      copyRevision,
      updatedAt: new Date(),
    })
    .where(eq(schema.jobs.id, jobId))
    .run();

  emitJobEvent(jobId, { type: "complete", result, copyRevision });
}

export function failJob(jobId: string, message: string) {
  const db = getDb();
  db.update(schema.jobs)
    .set({
      status: "failed",
      error: message,
      updatedAt: new Date(),
    })
    .where(eq(schema.jobs.id, jobId))
    .run();
  appendJobLog(jobId, `✗ Pipeline failed: ${message}`);
  emitJobEvent(jobId, { type: "error", message });
}

export function createJobRecord(config: CreateJobBody, assetId?: string) {
  const db = getDb();
  const id = crypto.randomUUID();
  const now = new Date();
  db.insert(schema.jobs)
    .values({
      id,
      assetId: assetId ?? null,
      status: "queued",
      configJson: JSON.stringify(config),
      progress: 0,
      copyRevision: 0,
      createdAt: now,
      updatedAt: now,
    })
    .run();

  appendJobLog(id, "SpineSync ASMR Studio v2.4 · job queued on server");
  return id;
}

export function markJobRunning(jobId: string) {
  const db = getDb();
  db.update(schema.jobs)
    .set({ status: "running", updatedAt: new Date() })
    .where(eq(schema.jobs.id, jobId))
    .run();
}

export function getJobById(jobId: string) {
  const db = getDb();
  return db.select().from(schema.jobs).where(eq(schema.jobs.id, jobId)).get();
}

export function getJobLogs(jobId: string) {
  const db = getDb();
  return db
    .select()
    .from(schema.jobLogs)
    .where(eq(schema.jobLogs.jobId, jobId))
    .orderBy(asc(schema.jobLogs.createdAt))
    .all();
}

export function getAssetById(assetId: string) {
  const db = getDb();
  return db
    .select()
    .from(schema.assets)
    .where(eq(schema.assets.id, assetId))
    .get();
}
