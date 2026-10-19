import type { JobStreamEvent } from "@/lib/contract/job";
import { assertJobAccess } from "@/lib/server/access";
import { buildJobPreviewUrls } from "@/lib/server/job-artifacts";
import { getJobLogs } from "@/lib/server/job-service";
import type { JobResult } from "@/lib/contract/job";
import { subscribeJob } from "@/lib/server/events";

function encodeSse(event: JobStreamEvent) {
  return `data: ${JSON.stringify(event)}\n\n`;
}

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const access = assertJobAccess(request, id);
  if ("error" in access && access.error) {
    const status = access.error.status;
    return new Response(status === 401 ? "Unauthorized" : "Forbidden", {
      status,
    });
  }
  if (!("job" in access)) {
    return new Response("Forbidden", { status: 403 });
  }
  const job = access.job;

  const stream = new ReadableStream({
    async start(controller) {
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
          const parsed = JSON.parse(job.resultJson) as JobResult;
          const result: JobResult = {
            ...parsed,
            previewUrls: await buildJobPreviewUrls(id),
          };
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
