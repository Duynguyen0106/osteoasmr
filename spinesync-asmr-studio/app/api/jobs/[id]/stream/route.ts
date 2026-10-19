import type { JobStreamEvent } from "@/lib/contract/job";
import { getJobById, getJobLogs } from "@/lib/server/job-service";
import { subscribeJob } from "@/lib/server/events";

function encodeSse(event: JobStreamEvent) {
  return `data: ${JSON.stringify(event)}\n\n`;
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const job = getJobById(id);
  if (!job) {
    return new Response("Job not found", { status: 404 });
  }

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();

      for (const log of getJobLogs(id)) {
        controller.enqueue(
          encoder.encode(
            encodeSse({
              type: "log",
              id: log.id,
              ts: log.ts,
              message: log.message,
            }),
          ),
        );
      }

      const unsubscribe = subscribeJob(id, (event) => {
        controller.enqueue(encoder.encode(encodeSse(event)));
        if (event.type === "complete" || event.type === "error") {
          unsubscribe();
          controller.close();
        }
      });

      if (job.status === "completed" && job.resultJson) {
        try {
          const result = JSON.parse(job.resultJson);
          controller.enqueue(
            encoder.encode(
              encodeSse({
                type: "complete",
                result,
                copyRevision: job.copyRevision ?? 1,
              }),
            ),
          );
        } catch {
          /* ignore */
        }
        unsubscribe();
        controller.close();
      } else if (job.status === "failed") {
        controller.enqueue(
          encoder.encode(
            encodeSse({
              type: "error",
              message: job.error ?? "Job failed",
            }),
          ),
        );
        unsubscribe();
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
