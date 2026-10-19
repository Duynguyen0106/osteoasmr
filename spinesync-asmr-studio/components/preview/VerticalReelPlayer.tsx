"use client";

import { Pause, Play } from "lucide-react";
import { useEffect, useState } from "react";
import { SubtitleOverlay } from "./SubtitleOverlay";
import { WaveformCanvas } from "./WaveformCanvas";
import type { SamplePreset } from "@/lib/types";

interface VerticalReelPlayerProps {
  preset: SamplePreset;
  eqBoost: number;
  tiktokSubs: boolean;
}

export function VerticalReelPlayer({
  preset,
  eqBoost,
  tiktokSubs,
}: VerticalReelPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [subtitleIndex, setSubtitleIndex] = useState(0);

  useEffect(() => {
    if (!isPlaying) return;
    const id = setInterval(() => {
      setSubtitleIndex((i) => (i + 1) % preset.subtitles.length);
    }, 2800);
    return () => clearInterval(id);
  }, [isPlaying, preset.subtitles.length]);

  const subtitle = preset.subtitles[subtitleIndex];

  return (
    <div className="glass-panel rounded-2xl p-4">
      <h3 className="mb-3 text-sm font-semibold text-white">9:16 Reel Preview</h3>
      <div className="mx-auto max-w-[280px]">
        <div className="neon-border relative aspect-[9/16] overflow-hidden rounded-2xl bg-gradient-to-b from-slate-800 via-slate-900 to-black">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(6,182,212,0.12),transparent_55%)]" />

          <div className="absolute left-0 right-0 top-0 flex items-center gap-2 bg-gradient-to-b from-black/80 to-transparent p-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-cyan-500/30 text-xs font-bold text-cyan-100">
              DS
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-white">
                Dr. Smith | SpineSync
              </p>
              <p className="text-[10px] text-slate-400">Licensed Clinic</p>
            </div>
            <span className="rounded bg-purple-500/30 px-2 py-0.5 text-[10px] font-bold text-purple-200">
              ASMR
            </span>
          </div>

          <SubtitleOverlay text={subtitle} enabled={tiktokSubs} />

          <WaveformCanvas isPlaying={isPlaying} eqBoost={eqBoost} />

          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-3 pt-8 text-center text-[10px] text-slate-200">
            📍 SpineSync Clinic | Book Link in Bio
          </div>

          <button
            type="button"
            aria-pressed={isPlaying}
            onClick={() => setIsPlaying((p) => !p)}
            className="absolute left-1/2 top-1/2 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-cyan-400/40 bg-black/50 text-white backdrop-blur-sm transition hover:bg-cyan-500/20"
          >
            {isPlaying ? (
              <Pause className="h-6 w-6" />
            ) : (
              <Play className="h-6 w-6 pl-0.5" />
            )}
          </button>
        </div>
        <p className="mt-2 text-center font-mono text-[10px] text-slate-500">
          1080×1920 scaled preview · peak @ 00:04.2
        </p>
      </div>
    </div>
  );
}
