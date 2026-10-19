"use client";

import type { CaptionSegment } from "@/lib/contract/job";
import {
  clampCaptionRange,
  moveCaptionSegment,
} from "@/lib/reel-edit/caption-timing";

function pct(time: number, duration: number) {
  if (duration <= 0) return 0;
  return Math.min(100, Math.max(0, (time / duration) * 100));
}

interface CaptionTimelineTrackProps {
  sourceDurationSec: number;
  captions: CaptionSegment[];
  selectedIndex: number;
  captionToolActive: boolean;
  onSelect: (index: number) => void;
  onTimingChange: (index: number, start: number, end: number) => void;
}

export function CaptionTimelineTrack({
  sourceDurationSec,
  captions,
  selectedIndex,
  captionToolActive,
  onSelect,
  onTimingChange,
}: CaptionTimelineTrackProps) {
  const sourceDur = Math.max(sourceDurationSec, 0.1);

  const timeFromClientX = (clientX: number, rect: DOMRect) =>
    (Math.min(rect.width, Math.max(0, clientX - rect.left)) / rect.width) *
    sourceDur;

  return (
    <div className="relative h-10 rounded-lg bg-slate-900/60">
      {!captions.length && (
        <span className="absolute inset-0 flex items-center justify-center text-[10px] text-slate-600">
          {captionToolActive
            ? "Add caption at playhead · drag blocks to move · resize edges"
            : "Captions after Whisper or manual add"}
        </span>
      )}
      {captions.map((c, i) => {
        const selected = i === selectedIndex;
        return (
          <div
            key={`${c.start}-${c.end}-${i}`}
            className={`absolute top-1 bottom-1 overflow-hidden rounded border ${
              selected
                ? "border-purple-300 bg-purple-500/45 ring-1 ring-purple-300/50"
                : "border-purple-400/30 bg-purple-500/30"
            }`}
            style={{
              left: `${pct(c.start, sourceDur)}%`,
              width: `${Math.max(4, pct(c.end - c.start, sourceDur))}%`,
            }}
          >
            {captionToolActive && (
              <div
                className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize bg-purple-300/30 hover:bg-purple-200/50 z-10"
                onPointerDown={(e) => {
                  e.stopPropagation();
                  const track = e.currentTarget.closest("[data-caption-track]") as HTMLElement;
                  const snapshot = { ...c };
                  const move = (ev: PointerEvent) => {
                    const rect = track.getBoundingClientRect();
                    const t = timeFromClientX(ev.clientX, rect);
                    const { start, end } = clampCaptionRange(
                      t,
                      snapshot.end,
                      sourceDur,
                    );
                    onTimingChange(i, start, end);
                  };
                  window.addEventListener("pointermove", move);
                  window.addEventListener(
                    "pointerup",
                    () => window.removeEventListener("pointermove", move),
                    { once: true },
                  );
                }}
                aria-label="Adjust caption start"
              />
            )}
            <button
              type="button"
              className={`h-full w-full truncate px-2 text-left text-[9px] text-purple-100 ${
                captionToolActive ? "cursor-grab active:cursor-grabbing" : ""
              }`}
              onClick={() => onSelect(i)}
              onPointerDown={
                captionToolActive
                  ? (e) => {
                      if (e.clientX - e.currentTarget.getBoundingClientRect().left < 8) return;
                      if (e.currentTarget.getBoundingClientRect().right - e.clientX < 8) return;
                      e.preventDefault();
                      const track = e.currentTarget.closest(
                        "[data-caption-track]",
                      ) as HTMLElement;
                      const snapshot = { ...c };
                      const startX = e.clientX;
                      const move = (ev: PointerEvent) => {
                        const rect = track.getBoundingClientRect();
                        const delta =
                          ((ev.clientX - startX) / rect.width) * sourceDur;
                        const moved = moveCaptionSegment(
                          snapshot,
                          delta,
                          sourceDur,
                        );
                        onTimingChange(i, moved.start, moved.end);
                      };
                      window.addEventListener("pointermove", move);
                      window.addEventListener(
                        "pointerup",
                        () => window.removeEventListener("pointermove", move),
                        { once: true },
                      );
                    }
                  : undefined
              }
              title={`${c.text} (${c.start.toFixed(2)}s – ${c.end.toFixed(2)}s)`}
            >
              {c.text.slice(0, 22)}
            </button>
            {captionToolActive && (
              <div
                className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize bg-purple-300/30 hover:bg-purple-200/50 z-10"
                onPointerDown={(e) => {
                  e.stopPropagation();
                  const track = e.currentTarget.closest("[data-caption-track]") as HTMLElement;
                  const snapshot = { ...c };
                  const move = (ev: PointerEvent) => {
                    const rect = track.getBoundingClientRect();
                    const t = timeFromClientX(ev.clientX, rect);
                    const { start, end } = clampCaptionRange(
                      snapshot.start,
                      t,
                      sourceDur,
                    );
                    onTimingChange(i, start, end);
                  };
                  window.addEventListener("pointermove", move);
                  window.addEventListener(
                    "pointerup",
                    () => window.removeEventListener("pointermove", move),
                    { once: true },
                  );
                }}
                aria-label="Adjust caption end"
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
