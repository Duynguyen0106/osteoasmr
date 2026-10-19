"use client";

import { AlertTriangle, Info } from "lucide-react";
import type { StudioHealth } from "@/hooks/useStudioHealth";
import { isServerPipeline } from "@/lib/pipeline-mode";

interface StudioCapabilityBannerProps {
  health: StudioHealth | null;
  healthError: string | null;
  mockEditPending?: boolean;
}

export function StudioCapabilityBanner({
  health,
  healthError,
  mockEditPending = false,
}: StudioCapabilityBannerProps) {
  if (!isServerPipeline) {
    return (
      <div
        className="relative mx-auto max-w-7xl space-y-2 px-4 pt-2 sm:px-6"
        role="status"
      >
        <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-center text-[11px] text-amber-100">
          <Info className="mr-1 inline h-3.5 w-3.5 align-text-bottom" aria-hidden />
          Mock pipeline mode — set{" "}
          <code className="text-amber-200">NEXT_PUBLIC_PIPELINE_MODE=server</code>{" "}
          at build time for SQLite, jobs, and ffmpeg exports.
        </p>
        {mockEditPending && (
          <p className="rounded-lg border border-fuchsia-500/30 bg-fuchsia-950/30 px-3 py-2 text-center text-[11px] text-fuchsia-100">
            Reel Pro Editor changes apply on export only in{" "}
            <strong>server mode</strong> — mock run will not trim or bake captions.
          </p>
        )}
      </div>
    );
  }

  const warnings: string[] = [];
  if (healthError) warnings.push(healthError);
  if (health && !health.ffmpeg) {
    warnings.push(
      "ffmpeg not detected — video pipeline stages will fail until ffmpeg is on PATH or bundled (ffmpeg-static).",
    );
  }
  if (health?.hosting?.ephemeralData && health.storage?.driver === "local") {
    warnings.push(
      "Ephemeral disk (e.g. Vercel /tmp) — configure STORAGE_DRIVER=s3 so reels and uploads persist.",
    );
  }
  if (health?.hosting?.pipelineReady === false && health.ffmpeg) {
    warnings.push("Pipeline blocked until durable storage (S3) is configured.");
  }
  if (health?.queue?.executor === "worker" && health.queue?.backend !== "redis") {
    warnings.push(
      "JOB_EXECUTOR=worker but Redis queue is off — jobs run inline only.",
    );
  }
  if (health?.remotion?.requested === "lambda") {
    warnings.push("REMOTION_RENDER=lambda is not deployed — using ffmpeg fallback.");
  }

  if (warnings.length === 0) return null;

  return (
    <div className="relative mx-auto max-w-7xl space-y-2 px-4 pt-2 sm:px-6">
      {warnings.map((text) => (
        <p
          key={text}
          className="rounded-lg border border-amber-500/25 bg-amber-950/40 px-3 py-2 text-[11px] text-amber-100"
          role="alert"
        >
          <AlertTriangle className="mr-1 inline h-3.5 w-3.5 align-text-bottom text-amber-400" aria-hidden />
          {text}
        </p>
      ))}
    </div>
  );
}
