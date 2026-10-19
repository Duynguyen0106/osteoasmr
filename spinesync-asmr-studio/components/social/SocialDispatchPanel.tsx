"use client";

import { CalendarClock, Send } from "lucide-react";

const PLATFORMS = [
  "Instagram Reels",
  "TikTok",
  "YouTube Shorts",
  "Facebook Reels",
] as const;

interface SocialDispatchPanelProps {
  onDispatch: (action: "immediate" | "queue") => void;
  pipelineComplete: boolean;
}

export function SocialDispatchPanel({
  onDispatch,
  pipelineComplete,
}: SocialDispatchPanelProps) {
  return (
    <div className="glass-panel rounded-2xl p-4">
      <h3 className="mb-3 text-sm font-semibold text-white">
        Social Multi-Dispatch
      </h3>
      <ul className="mb-4 grid grid-cols-2 gap-2">
        {PLATFORMS.map((name) => (
          <li
            key={name}
            className="flex items-center gap-2 rounded-lg border border-slate-700/40 bg-slate-900/30 px-2 py-2 text-[11px] text-slate-300"
          >
            <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399]" />
            {name}
          </li>
        ))}
      </ul>
      <div className="flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          onClick={() => onDispatch("immediate")}
          className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-emerald-600/80 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-500/90"
        >
          <Send className="h-3.5 w-3.5" />
          Post Immediately
        </button>
        <button
          type="button"
          onClick={() => onDispatch("queue")}
          className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-purple-500/40 bg-purple-500/10 px-3 py-2 text-xs font-semibold text-purple-200 hover:bg-purple-500/20"
        >
          <CalendarClock className="h-3.5 w-3.5" />
          Queue Peak Hour
        </button>
      </div>
      {!pipelineComplete && (
        <p className="mt-2 text-[10px] text-slate-500">
          Tip: run the full pipeline first for optimized assets (optional).
        </p>
      )}
    </div>
  );
}
