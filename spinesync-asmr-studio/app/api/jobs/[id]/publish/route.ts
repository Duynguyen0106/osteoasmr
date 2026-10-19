import { NextResponse } from "next/server";
import { publishBodySchema } from "@/lib/contract/job";
import { appendJobLog, getJobById } from "@/lib/server/job-service";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const job = getJobById(id);
  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  const json = await request.json();
  const parsed = publishBodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid publish payload" }, { status: 400 });
  }

  const { mode, platforms } = parsed.data;
  if (mode === "immediate") {
    appendJobLog(
      id,
      `Ayrshare · Post Immediately → ${platforms.join(", ")}`,
    );
  } else {
    appendJobLog(
      id,
      `Ayrshare · Queued for peak hour (18:00 local) · ${platforms.length} channels`,
    );
  }

  return NextResponse.json({ ok: true, mode, platforms });
}
