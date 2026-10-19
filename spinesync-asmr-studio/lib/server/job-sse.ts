import type { JobStreamEvent, JobResult } from "@/lib/contract/job";
import { buildJobPreviewUrls } from "@/lib/server/job-artifacts";
import { getJobLogs } from "@/lib/server/job-service";
import { subscribeJob } from "@/lib/server/events";

function encodeSse(event: JobStreamEvent) {
  return `data: ${JSON.stringify(event)}\n\n`;
}

type JobRow = {
  status: string;
  resultJson: string | null;
  copyRevision: number | null;
  error: string | null;
};

export function jobEventStreamResponse(jobId: string, job: JobRow) {
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();

      for (const log of getJobLogs(jobId)) {
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

      const unsubscribe = subscribeJob(jobId, (event) => {
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
            previewUrls: await buildJobPreviewUrls(jobId),
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
