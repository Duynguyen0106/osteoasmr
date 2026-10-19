import { NextResponse } from "next/server";
import { createJobBodySchema, type JobResult } from "@/lib/contract/job";
import { PIPELINE_STAGES, createInitialStageStatus } from "@/lib/pipeline";
import type { PipelineStageId, StageStatus } from "@/lib/types";
import { assertJobAccess } from "@/lib/server/access";
import { buildJobPreviewUrls } from "@/lib/server/job-artifacts";
import { getJobLogs } from "@/lib/server/job-service";

function buildStageMap(
  status: string,
  currentStage: string | null,
): Record<PipelineStageId, StageStatus> {
  const stages = createInitialStageStatus();
  if (status === "completed") {
    for (const stage of PIPELINE_STAGES) {
      stages[stage.id as PipelineStageId] = "done";
    }
    return stages;
  }
  if (!currentStage || status !== "running") {
    return stages;
  }
  const currentIndex = PIPELINE_STAGES.findIndex((s) => s.id === currentStage);
  PIPELINE_STAGES.forEach((stage, index) => {
    const id = stage.id as PipelineStageId;
    if (index < currentIndex) stages[id] = "done";
    else if (index === currentIndex) stages[id] = "running";
    else stages[id] = "idle";
  });
  return stages;
}

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const access = assertJobAccess(request, id);
  if ("error" in access) return access.error;
  const job = access.job;

  const logs = getJobLogs(id).map((l) => ({
    id: l.id,
    ts: l.ts,
    message: l.message,
  }));

  let result: JobResult | null = null;
  if (job.resultJson) {
    try {
      result = JSON.parse(job.resultJson) as JobResult;
      if (result) {
        result = {
          ...result,
          previewUrls: await buildJobPreviewUrls(id),
        };
      }
    } catch {
      result = null;
    }
  }

  let edit: ReturnType<typeof createJobBodySchema.parse>["edit"];
  try {
    const parsed = createJobBodySchema.safeParse(JSON.parse(job.configJson));
    edit = parsed.success ? parsed.data.edit : undefined;
  } catch {
    edit = undefined;
  }

  return NextResponse.json({
    id: job.id,
    status: job.status,
    progress: job.progress,
    currentStageId: job.currentStage,
    stages: buildStageMap(job.status, job.currentStage),
    logs,
    copyRevision: job.copyRevision,
    result,
    error: job.error,
    edit,
  });
}
