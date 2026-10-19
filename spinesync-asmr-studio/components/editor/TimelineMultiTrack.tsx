"use client";

import type { CaptionSegment } from "@/lib/contract/job";
import type { ReelEditState } from "@/lib/contract/reel-edit";
import type { EditorTool } from "@/hooks/useReelEditor";
import { clipDurationSec } from "@/lib/reel-edit/normalize";

function pct(time: number, duration: number) {
  if (duration <= 0) return 0;
  return Math.min(100, Math.max(0, (time / duration) * 100));
}

interface TimelineMultiTrackProps {
  sourceDurationSec: number;
  edit: ReelEditState;
  playheadSec: number;
  peakSec: number;
  tool: EditorTool;
  envelope: number[] | null;
  captions: CaptionSegment[] | null | undefined;
  onSeekClip: (clipTimeSec: number) => void;
  onTrimInChange: (sourceSec: number) => void;
  onTrimOutChange: (sourceSec: number) => void;
  onPeakChange: (clipSec: number) => void;
  onSelectCaption?: (index: number) => void;
}

export function TimelineMultiTrack({
  sourceDurationSec,
  edit,
  playheadSec,
  peakSec,
  tool,
  envelope,
  captions,
  onSeekClip,
  onTrimInChange,
  onTrimOutChange,
  onPeakChange,
  onSelectCaption,
}: TimelineMultiTrackProps) {
  const sourceDur = Math.max(sourceDurationSec, 0.1);
  const trimOut = edit.trimOutSec ?? sourceDur;
  const clipDur = clipDurationSec(edit);
  const playheadSource = edit.trimInSec + playheadSec;
  const peakSource = edit.trimInSec + peakSec;

  const timeFromEvent = (clientX: number, rect: DOMRect) =>
    (Math.min(rect.width, Math.max(0, clientX - rect.left)) / rect.width) *
    sourceDur;

  return (
    <div className="space-y-2 rounded-xl border border-slate-700/60 bg-slate-950/50 p-3">
      <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-slate-500">
        <span>Multi-track · source ruler</span>
        <span className="font-mono text-cyan-400/90">
          clip {clipDur.toFixed(1)}s / {sourceDur.toFixed(1)}s
        </span>
      </div>

      <div className="relative h-10 rounded-lg bg-slate-800/80 overflow-hidden">
        <div
          className="absolute inset-y-0 bg-cyan-500/15 border-x border-cyan-400/40"
          style={{
            left: `${pct(edit.trimInSec, sourceDur)}%`,
            width: `${pct(trimOut - edit.trimInSec, sourceDur)}%`,
          }}
        />
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-white/90 z-20"
          style={{ left: `${pct(playheadSource, sourceDur)}%` }}
        />
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-amber-400/90 z-10"
          style={{ left: `${pct(peakSource, sourceDur)}%` }}
          title="Peak"
        />
        <div
          className="absolute inset-0 cursor-crosshair z-0"
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const src = timeFromEvent(e.clientX, rect);
            const clipT = Math.max(0, Math.min(clipDur, src - edit.trimInSec));
            onSeekClip(clipT);
          }}
          role="slider"
          aria-label="Timeline seek"
          aria-valuemin={0}
          aria-valuemax={sourceDur}
          aria-valuenow={playheadSource}
          tabIndex={0}
        />
        {tool === "trim" && (
          <>
            <div
              className="absolute top-0 bottom-0 w-1.5 -ml-0.5 bg-emerald-400 cursor-ew-resize z-30"
              style={{ left: `${pct(edit.trimInSec, sourceDur)}%` }}
              onPointerDown={(e) => {
                e.preventDefault();
                const el = e.currentTarget.parentElement!;
                const move = (ev: PointerEvent) =>
                  onTrimInChange(timeFromEvent(ev.clientX, el.getBoundingClientRect()));
                window.addEventListener("pointermove", move);
                window.addEventListener(
                  "pointerup",
                  () => window.removeEventListener("pointermove", move),
                  { once: true },
                );
              }}
              title="Trim in"
            />
            <div
              className="absolute top-0 bottom-0 w-1.5 -ml-0.5 bg-rose-400 cursor-ew-resize z-30"
              style={{ left: `${pct(trimOut, sourceDur)}%` }}
              onPointerDown={(e) => {
                e.preventDefault();
                const el = e.currentTarget.parentElement!;
                const move = (ev: PointerEvent) =>
                  onTrimOutChange(timeFromEvent(ev.clientX, el.getBoundingClientRect()));
                window.addEventListener("pointermove", move);
                window.addEventListener(
                  "pointerup",
                  () => window.removeEventListener("pointermove", move),
                  { once: true },
                );
              }}
              title="Trim out"
            />
          </>
        )}
        {tool === "peak" && (
          <div
            className="absolute top-0 bottom-0 w-1.5 -ml-0.5 bg-amber-300 cursor-ew-resize z-30 shadow-[0_0_8px_#fcd34d]"
            style={{ left: `${pct(peakSource, sourceDur)}%` }}
            onPointerDown={(e) => {
              e.preventDefault();
              const el = e.currentTarget.parentElement!;
              const move = (ev: PointerEvent) => {
                const src = timeFromEvent(ev.clientX, el.getBoundingClientRect());
                onPeakChange(Math.max(0, Math.min(clipDur, src - edit.trimInSec)));
              };
              window.addEventListener("pointermove", move);
              window.addEventListener(
                "pointerup",
                () => window.removeEventListener("pointermove", move),
                { once: true },
              );
            }}
            title="Adjustment peak"
          />
        )}
      </div>

      <div className="relative h-14 rounded-lg bg-slate-900/80 overflow-hidden">
        {envelope?.length ? (
          <svg
            className="h-full w-full"
            viewBox={`0 0 ${envelope.length} 100`}
            preserveAspectRatio="none"
          >
            {envelope.map((h, i) => (
              <rect
                key={i}
                x={i}
                y={100 - h * 100}
                width={1}
                height={h * 100}
                fill="rgba(34,211,238,0.45)"
              />
            ))}
          </svg>
        ) : (
          <div className="flex h-full items-center justify-center text-[10px] text-slate-600">
            Waveform lane
          </div>
        )}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-white/70 pointer-events-none"
          style={{ left: `${pct(playheadSource, sourceDur)}%` }}
        />
      </div>

      <div className="relative h-8 rounded-lg bg-slate-900/60">
        {captions?.map((c, i) => (
          <button
            key={`${c.start}-${i}`}
            type="button"
            className="absolute top-1 bottom-1 rounded bg-purple-500/30 px-1 text-[9px] text-purple-100 truncate border border-purple-400/30 hover:bg-purple-500/45"
            style={{
              left: `${pct(c.start, sourceDur)}%`,
              width: `${Math.max(3, pct(c.end - c.start, sourceDur))}%`,
            }}
            onClick={() => onSelectCaption?.(i)}
            title={c.text}
          >
            {c.text.slice(0, 20)}
          </button>
        ))}
      </div>
    </div>
  );
}
