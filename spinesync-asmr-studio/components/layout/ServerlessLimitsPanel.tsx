"use client";

import { Timer } from "lucide-react";
import type { StudioHealth } from "@/hooks/useStudioHealth";
import { isServerPipeline } from "@/lib/pipeline-mode";

interface ServerlessLimitsPanelProps {
  health: StudioHealth | null;
}

export function ServerlessLimitsPanel({ health }: ServerlessLimitsPanelProps) {
  if (!isServerPipeline || health?.hosting?.serverless !== true) return null;

  const maxSec = health.hosting?.maxFunctionDurationSec;
  const durationHint =
    maxSec && maxSec > 0
      ? `This deployment allows ~${maxSec}s per function.`
      : "Serverless functions often cap at 60s (Hobby) or up to 300s (Pro).";

  return (
    <div
      className="rounded-xl border border-amber-500/20 bg-amber-950/20 p-3 space-y-1"
      role="status"
    >
      <div className="flex items-center gap-2 text-xs font-semibold text-amber-100">
        <Timer className="h-4 w-4 text-amber-400" aria-hidden />
        Serverless time limits
      </div>
      <p className="text-[11px] text-slate-400 leading-relaxed">
        {durationHint} Multi-stage ffmpeg + Remotion may exceed that when{" "}
        <code className="text-slate-300">JOB_EXECUTOR=inline</code>. Prefer Redis queue +
        external worker, S3 artifacts, and check job SSE logs if a run stops mid-stage.
      </p>
    </div>
  );
}
