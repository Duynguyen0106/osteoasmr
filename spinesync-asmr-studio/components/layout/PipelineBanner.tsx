"use client";

import type { ComponentType } from "react";
import { motion } from "framer-motion";
import {
  Check,
  Film,
  Hash,
  ImageIcon,
  Loader2,
  Mic2,
  Radio,
  Sparkles,
} from "lucide-react";
import { PIPELINE_STAGES } from "@/lib/pipeline";
import type { PipelineStageId, StageStatus } from "@/lib/types";

const STAGE_ICONS: Record<
  PipelineStageId,
  ComponentType<{ className?: string }>
> = {
  eq: Radio,
  whisper: Mic2,
  remotion: Film,
  thumbnail: ImageIcon,
  gpt: Sparkles,
  dispatch: Hash,
};

interface PipelineBannerProps {
  progress: number;
  stages: Record<PipelineStageId, StageStatus>;
  currentStageId: PipelineStageId | null;
  running: boolean;
}

function StageIcon({ status }: { status: StageStatus }) {
  if (status === "running") {
    return <Loader2 className="h-4 w-4 animate-spin text-cyan-300" />;
  }
  if (status === "done") {
    return <Check className="h-4 w-4 text-emerald-400" />;
  }
  return <span className="h-2 w-2 rounded-full bg-slate-600" />;
}

export function PipelineBanner({
  progress,
  stages,
  currentStageId,
  running,
}: PipelineBannerProps) {
  return (
    <section className="glass-panel mx-auto max-w-7xl rounded-2xl px-4 py-4 sm:mx-6 sm:px-6">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-300">
          AI Pipeline Status
        </h2>
        <span className="font-mono text-sm text-cyan-400">{progress}%</span>
      </div>
      <div className="mb-4 h-2 overflow-hidden rounded-full bg-slate-800/80">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-cyan-500 via-cyan-400 to-purple-500"
          initial={false}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        />
      </div>
      <ol className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {PIPELINE_STAGES.map((stage) => {
          const Icon = STAGE_ICONS[stage.id];
          const status = stages[stage.id];
          const isActive = currentStageId === stage.id && running;
          return (
            <li
              key={stage.id}
              className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs transition-colors ${
                isActive
                  ? "border-cyan-400/40 bg-cyan-500/10"
                  : status === "done"
                    ? "border-emerald-500/20 bg-emerald-500/5"
                    : "border-slate-700/50 bg-slate-900/30"
              }`}
            >
              <Icon className="h-3.5 w-3.5 shrink-0 text-cyan-400/80" />
              <span className="min-w-0 flex-1 truncate text-slate-300">
                {stage.label}
              </span>
              <StageIcon status={status} />
            </li>
          );
        })}
      </ol>
    </section>
  );
}
