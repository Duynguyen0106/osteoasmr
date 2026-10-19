/**
 * Poll SQLite for queued jobs and run the pipeline (JOB_EXECUTOR=worker).
 *
 * Usage: npm run worker:pipeline
 */
import { jobExecutor } from "../lib/server/config";
import { ensureDefaultProject } from "../lib/server/auth";
import { getDb } from "../lib/server/db";
import type { CreateJobBody } from "../lib/contract/job";
import { claimNextQueuedJob } from "../lib/server/job-service";
import { runJobPipeline } from "../lib/server/pipeline-runner";

async function tick() {
  const job = claimNextQueuedJob();
  if (!job) return false;

  const config = JSON.parse(job.configJson) as CreateJobBody;
  await runJobPipeline(job.id, config);
  return true;
}

async function main() {
  if (jobExecutor() !== "worker") {
    console.warn("JOB_EXECUTOR is not 'worker' — worker still runs queued jobs.");
  }
  ensureDefaultProject();
  getDb();
  console.log("SpineSync pipeline worker started");

  for (;;) {
    const ran = await tick();
    if (!ran) {
      await new Promise((r) => setTimeout(r, 2000));
    }
  }
}

void main();
