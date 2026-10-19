"use client";

import { Workflow } from "lucide-react";
import type { StudioHealth } from "@/hooks/useStudioHealth";
import { isServerPipeline } from "@/lib/pipeline-mode";
import { OpsEnvBlock } from "@/components/layout/OpsEnvBlock";

const WORKER_ENV_LINES = [
  "JOB_EXECUTOR=worker",
  "JOB_QUEUE_BACKEND=redis",
  "REDIS_URL=redis://user:pass@host:6379",
  "# Run on a long-lived host (not Vercel serverless):",
  "# npm run worker:pipeline",
] as const;

interface WorkerQueuePanelProps {
  health: StudioHealth | null;
}

export function WorkerQueuePanel({ health }: WorkerQueuePanelProps) {
  if (!isServerPipeline || !health) return null;

  const wantsWorker = health.queue?.executor === "worker";
  const redisLive = health.queue?.redisLive === true;
  const onServerless = health.hosting?.serverless === true;
  const recommendWorker =
    onServerless && health.queue?.executor === "inline" && health.hosting?.pipelineReady;

  const misconfigured = wantsWorker && !redisLive;
  if (!misconfigured && !recommendWorker) return null;

  return (
    <OpsEnvBlock
      title={
        misconfigured
          ? "Background worker needs Redis"
          : "Long ffmpeg jobs — use a worker"
      }
      icon={<Workflow className="h-4 w-4 text-cyan-400" aria-hidden />}
      borderClass="border-cyan-500/25 bg-cyan-950/25"
      titleClass="text-cyan-100"
      description={
        misconfigured ? (
          <>
            <code className="text-slate-300">JOB_EXECUTOR=worker</code> is set but Redis
            is not connected. Either add <code className="text-slate-300">REDIS_URL</code>{" "}
            or set <code className="text-slate-300">JOB_EXECUTOR=inline</code> for dev-only
            inline runs.
          </>
        ) : (
          <>
            Vercel functions time out (often 60–300s). For full reel renders, queue jobs
            with Redis and run <code className="text-slate-300">npm run worker:pipeline</code>{" "}
            on a VM, Railway, or Fly.io with ffmpeg + S3.
          </>
        )
      }
      envLines={WORKER_ENV_LINES}
    />
  );
}
