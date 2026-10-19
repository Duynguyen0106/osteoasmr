import { NextResponse } from "next/server";
import { createJobBodySchema } from "@/lib/contract/job";
import {
  assertAssetAccess,
  resolveProjectFromRequest,
  unauthorized,
} from "@/lib/server/access";
import { jobExecutor } from "@/lib/server/config";
import { createJobRecord } from "@/lib/server/job-service";
import { enqueueJob } from "@/lib/server/pipeline-runner";
import { enqueueRedisJob, redisQueueEnabled } from "@/lib/server/redis-queue";

export async function POST(request: Request) {
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
      enqueueJob(jobId, config);
    } else if (redisQueueEnabled()) {
      await enqueueRedisJob(jobId);
    }

    return NextResponse.json({
      jobId,
      status: jobExecutor() === "worker" ? "queued" : "queued",
      executor: jobExecutor(),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create job";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
