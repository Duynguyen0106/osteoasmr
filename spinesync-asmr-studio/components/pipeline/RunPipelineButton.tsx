"use client";

import { Loader2, Zap } from "lucide-react";

interface RunPipelineButtonProps {
  running: boolean;
  disabled?: boolean;
  blockReason?: string;
  onRun: () => void;
}

export function RunPipelineButton({
  running,
  disabled,
  blockReason,
  onRun,
}: RunPipelineButtonProps) {
  return (
    <div className="space-y-1">
    <button
      type="button"
      disabled={running || disabled}
      onClick={onRun}
      className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-600 to-cyan-500 px-4 py-3 text-sm font-bold uppercase tracking-wide text-white shadow-[0_0_24px_rgba(6,182,212,0.35)] transition hover:from-cyan-500 hover:to-cyan-400 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {running ? (
        <>
          <Loader2 className="h-5 w-5 animate-spin" />
          Pipeline running…
        </>
      ) : (
        <>
          <Zap className="h-5 w-5" />
          Run Full AI Pipeline
        </>
      )}
    </button>
    {blockReason && disabled && !running && (
      <p className="text-center text-[10px] text-amber-300/90" role="status">
        {blockReason}
      </p>
    )}
    </div>
  );
}
