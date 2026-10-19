import { connection } from "next/server";
import { NextResponse } from "next/server";
import { createJobBodySchema } from "@/lib/contract/job";
import {
  assertAssetAccess,
  resolveProjectFromRequest,
  unauthorized,
} from "@/lib/server/access";
import { jobExecutor } from "@/lib/server/config";
import { createJobRecord, listRecentJobs } from "@/lib/server/job-service";

/** Avoid loading ffmpeg/Remotion pipeline on GET /api/jobs (Hobby serverless OOM). */
async function loadPipelineEnqueue() {
  const { enqueueJob } = await import("@/lib/server/pipeline-runner");
  return enqueueJob;
}

export async function GET(request: Request) {
  await connection();
  try {
    const projectId = resolveProjectFromRequest(request);
    if (!projectId) return unauthorized();
    const jobs = listRecentJobs(projectId, 25);
    return NextResponse.json({ jobs });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to list jobs";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  await connection();
  try {
    const json = await request.json();
    const parsed = createJobBodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid job payload", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const config = parsed.data;
    const projectId = resolveProjectFromRequest(request);
    if (!projectId) {
      return unauthorized();
    }

    if (config.assetId) {
      const assetCheck = assertAssetAccess(request, config.assetId);
      if ("error" in assetCheck) return assetCheck.error;
    }

    const jobId = createJobRecord(config, projectId, config.assetId);

    if (jobExecutor() === "inline") {
      const enqueueJob = await loadPipelineEnqueue();
      enqueueJob(jobId, config);
    } else if (jobExecutor() === "worker") {
      const { enqueueRedisJob, redisQueueEnabled } = await import(
        "@/lib/server/redis-queue"
      );
      if (redisQueueEnabled()) {
        try {
          await enqueueRedisJob(jobId);
        } catch (err) {
          const message =
            err instanceof Error ? err.message : "Failed to enqueue job on Redis";
          return NextResponse.json({ error: message }, { status: 503 });
        }
      }
    }

    return NextResponse.json({
      jobId,
      status: "queued",
      executor: jobExecutor(),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create job";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
