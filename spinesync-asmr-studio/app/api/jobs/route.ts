import { NextResponse } from "next/server";
import { createJobBodySchema } from "@/lib/contract/job";
import { createJobRecord } from "@/lib/server/job-service";
import { enqueueJob } from "@/lib/server/pipeline-runner";

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
    const jobId = createJobRecord(config, config.assetId);
    enqueueJob(jobId, config);

    return NextResponse.json({ jobId, status: "queued" });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create job";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
