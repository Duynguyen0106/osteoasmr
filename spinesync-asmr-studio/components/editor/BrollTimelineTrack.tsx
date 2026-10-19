"use client";

import type { BrollOverlay } from "@/lib/contract/reel-edit";
import { clampBrollRange, moveBrollOverlay } from "@/lib/reel-edit/broll";

function pct(time: number, duration: number) {
  if (duration <= 0) return 0;
  return Math.min(100, Math.max(0, (time / duration) * 100));
}

interface BrollTimelineTrackProps {
  sourceDurationSec: number;
  overlays: BrollOverlay[];
  selectedIndex: number;
  brollToolActive: boolean;
  onSelect: (index: number) => void;
  onTimingChange: (index: number, startSec: number, endSec: number) => void;
  onRemove?: (index: number) => void;
}

export function BrollTimelineTrack({
  sourceDurationSec,
  overlays,
  selectedIndex,
  brollToolActive,
  onSelect,
  onTimingChange,
  onRemove,
}: BrollTimelineTrackProps) {
  const sourceDur = Math.max(sourceDurationSec, 0.1);

  const timeFromClientX = (clientX: number, rect: DOMRect) =>
    (Math.min(rect.width, Math.max(0, clientX - rect.left)) / rect.width) *
    sourceDur;

  return (
    <div className="relative h-10 rounded-lg bg-slate-900/60" data-broll-track>
      {!overlays.length && (
        <span className="absolute inset-0 flex items-center justify-center text-[10px] text-slate-600">
          {brollToolActive
            ? "Upload B-roll · drag blocks · resize edges · Del removes"
            : "B-roll cutaways (server export)"}
        </span>
      )}
      {overlays.map((b, i) => {
        const selected = i === selectedIndex;
        const label = b.label?.trim() || `B-roll ${i + 1}`;
        return (
          <div
            key={b.id}
            className={`absolute top-1 bottom-1 overflow-hidden rounded border ${
              selected
                ? "border-teal-200 bg-teal-500/45 ring-1 ring-teal-200/50"
                : "border-teal-400/30 bg-teal-500/25"
            }`}
            style={{
              left: `${pct(b.startSec, sourceDur)}%`,
              width: `${Math.max(4, pct(b.endSec - b.startSec, sourceDur))}%`,
            }}
          >
            {brollToolActive && (
              <div
                className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize bg-teal-200/30 hover:bg-teal-100/50 z-10"
                onPointerDown={(e) => {
                  e.stopPropagation();
                  const track = e.currentTarget.closest(
                    "[data-broll-track]",
                  ) as HTMLElement;
                  const snapshot = { ...b };
                  const move = (ev: PointerEvent) => {
                    const rect = track.getBoundingClientRect();
                    const t = timeFromClientX(ev.clientX, rect);
                    const { startSec, endSec } = clampBrollRange(
                      t,
                      snapshot.endSec,
                      sourceDur,
                    );
                    onTimingChange(i, startSec, endSec);
                  };
                  window.addEventListener("pointermove", move);
                  window.addEventListener(
                    "pointerup",
                    () => window.removeEventListener("pointermove", move),
                    { once: true },
                  );
                }}
                aria-label="Adjust B-roll start"
              />
            )}
            <button
              type="button"
              className={`h-full w-full truncate px-2 text-left text-[9px] text-teal-50 ${
                brollToolActive ? "cursor-grab active:cursor-grabbing" : ""
              }`}
              onClick={() => onSelect(i)}
              onPointerDown={
                brollToolActive
                  ? (e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      if (e.clientX - rect.left < 8) return;
                      if (rect.right - e.clientX < 8) return;
                      e.preventDefault();
                      const track = e.currentTarget.closest(
                        "[data-broll-track]",
                      ) as HTMLElement;
                      const startX = e.clientX;
                      const snapshot = { ...b };
                      const move = (ev: PointerEvent) => {
                        const trackRect = track.getBoundingClientRect();
                        const delta =
                          ((ev.clientX - startX) / trackRect.width) * sourceDur;
                        const moved = moveBrollOverlay(
                          snapshot,
                          delta,
                          sourceDur,
                        );
                        onTimingChange(i, moved.startSec, moved.endSec);
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
            >
              {label}
            </button>
            {brollToolActive && (
              <div
                className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize bg-teal-200/30 hover:bg-teal-100/50 z-10"
                onPointerDown={(e) => {
                  e.stopPropagation();
                  const track = e.currentTarget.closest(
                    "[data-broll-track]",
                  ) as HTMLElement;
                  const snapshot = { ...b };
                  const move = (ev: PointerEvent) => {
                    const rect = track.getBoundingClientRect();
                    const t = timeFromClientX(ev.clientX, rect);
                    const { startSec, endSec } = clampBrollRange(
                      snapshot.startSec,
                      t,
                      sourceDur,
                    );
                    onTimingChange(i, startSec, endSec);
                  };
                  window.addEventListener("pointermove", move);
                  window.addEventListener(
                    "pointerup",
                    () => window.removeEventListener("pointermove", move),
                    { once: true },
                  );
                }}
                aria-label="Adjust B-roll end"
              />
            )}
            {brollToolActive && selected && onRemove && (
              <button
                type="button"
                className="absolute -top-1 -right-1 z-20 rounded bg-rose-600 px-1 text-[8px] text-white"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove(i);
                }}
                aria-label="Remove B-roll clip"
              >
                ×
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
