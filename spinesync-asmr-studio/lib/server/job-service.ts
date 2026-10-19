import { and, asc, desc, eq, isNull, or } from "drizzle-orm";
import { getDefaultProjectId } from "./auth";
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

export function createJobRecord(
  config: CreateJobBody,
  projectId: string,
  assetId?: string,
) {
  const db = getDb();
  const id = crypto.randomUUID();
  const now = new Date();
  db.insert(schema.jobs)
    .values({
      id,
      projectId,
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

export function claimNextQueuedJob() {
  const db = getDb();
  return db.transaction((tx) => {
    const job = tx
      .select()
      .from(schema.jobs)
      .where(eq(schema.jobs.status, "queued"))
      .orderBy(asc(schema.jobs.createdAt))
      .get();
    if (!job) return null;

    const result = tx
      .update(schema.jobs)
      .set({ status: "running", updatedAt: new Date() })
      .where(and(eq(schema.jobs.id, job.id), eq(schema.jobs.status, "queued")))
      .run();
    if (result.changes === 0) return null;
    return job;
  });
}

export function tryClaimJobById(jobId: string) {
  const db = getDb();
  const result = db
    .update(schema.jobs)
    .set({ status: "running", updatedAt: new Date() })
    .where(and(eq(schema.jobs.id, jobId), eq(schema.jobs.status, "queued")))
    .run();
  if (result.changes === 0) return null;
  return getJobById(jobId);
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

export function listRecentJobs(projectId: string, limit = 20) {
  const db = getDb();
  return db
    .select({
      id: schema.jobs.id,
      status: schema.jobs.status,
      progress: schema.jobs.progress,
      createdAt: schema.jobs.createdAt,
      sourceLabel: schema.jobs.configJson,
    })
    .from(schema.jobs)
    .where(
      projectId === getDefaultProjectId()
        ? or(eq(schema.jobs.projectId, projectId), isNull(schema.jobs.projectId))
        : eq(schema.jobs.projectId, projectId),
    )
    .orderBy(desc(schema.jobs.createdAt))
    .limit(limit)
    .all()
    .map((row) => {
      let label = "Job";
      try {
        const cfg = JSON.parse(row.sourceLabel) as { sourceLabel?: string };
        label = cfg.sourceLabel ?? label;
      } catch {
        /* ignore */
      }
      return {
        id: row.id,
        status: row.status,
        progress: row.progress,
        createdAt: row.createdAt,
        sourceLabel: label,
      };
    });
}

export function getAssetById(assetId: string) {
  const db = getDb();
  return db
    .select()
    .from(schema.assets)
    .where(eq(schema.assets.id, assetId))
    .get();
}
