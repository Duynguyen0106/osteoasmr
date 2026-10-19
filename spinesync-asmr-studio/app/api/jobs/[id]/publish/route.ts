import { NextResponse } from "next/server";
import type { JobCopyResult, JobResult } from "@/lib/contract/job";
import { publishBodySchema } from "@/lib/contract/job";
import { publishViaAyrshare } from "@/lib/server/ayrshare";
import { assertJobAccess } from "@/lib/server/access";
import { appendJobLog } from "@/lib/server/job-service";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const access = assertJobAccess(request, id);
  if ("error" in access) return access.error;
  const job = access.job;

  if (job.status !== "completed") {
    return NextResponse.json(
      { error: "Job must complete before publish" },
      { status: 409 },
    );
  }

  const json = await request.json();
  const parsed = publishBodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid publish payload" }, { status: 400 });
  }

  let copy: JobCopyResult | undefined;
  if (job.resultJson) {
    try {
      copy = (JSON.parse(job.resultJson) as JobResult).copy;
    } catch {
      copy = undefined;
    }
  }

  const caption = copy?.instagram ?? "SpineSync ASMR · Book link in bio";

  const outcome = await publishViaAyrshare({
    jobId: id,
    caption,
    publish: parsed.data,
  });

  const { mode, platforms } = parsed.data;
  if (outcome.ok) {
    appendJobLog(
      id,
      `Ayrshare (${outcome.provider}) · ${mode === "immediate" ? "Post Immediately" : "Queue Peak Hour"} → ${platforms.join(", ")} · ${outcome.detail}${outcome.postId ? ` · id=${outcome.postId}` : ""}`,
    );
  } else {
    appendJobLog(id, `Ayrshare error · ${outcome.detail}`);
    return NextResponse.json({ error: outcome.detail }, { status: 502 });
  }

  return NextResponse.json({ mode, platforms, ...outcome });
}
