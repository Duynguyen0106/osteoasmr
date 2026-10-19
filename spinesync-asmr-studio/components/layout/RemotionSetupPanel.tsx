"use client";

import { Clapperboard } from "lucide-react";
import type { StudioHealth } from "@/hooks/useStudioHealth";
import { isServerPipeline } from "@/lib/pipeline-mode";
import { OpsEnvBlock } from "@/components/layout/OpsEnvBlock";

const REMOTION_LOCAL_LINES = [
  "REMOTION_RENDER=local",
  "# Requires @remotion/renderer on the worker host",
  "# Lambda path is not deployed in this repo",
] as const;

interface RemotionSetupPanelProps {
  health: StudioHealth | null;
}

export function RemotionSetupPanel({ health }: RemotionSetupPanelProps) {
  if (!isServerPipeline || !health?.remotion) return null;

  const requested = health.remotion.requested;
  const lambdaNotDeployed = health.remotion.lambdaDeployed === false;

  if (requested !== "lambda" || !lambdaNotDeployed) return null;

  return (
    <OpsEnvBlock
      title="Remotion Lambda not available"
      icon={<Clapperboard className="h-4 w-4 text-fuchsia-400" aria-hidden />}
      borderClass="border-fuchsia-500/25 bg-fuchsia-950/25"
      titleClass="text-fuchsia-100"
      description={
        <>
          <code className="text-slate-300">REMOTION_RENDER=lambda</code> is set but Lambda is
          not deployed. The pipeline falls back to ffmpeg for reels. Use{" "}
          <code className="text-slate-300">REMOTION_RENDER=local</code> on a worker with
          Chrome/Chromium, or <code className="text-slate-300">off</code> for ffmpeg-only.
        </>
      }
      envLines={REMOTION_LOCAL_LINES}
    />
  );
}
