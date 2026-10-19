import type { ReelEditState } from "@/lib/contract/reel-edit";

const MIN_CLIP_SEC = 0.25;

/** Clamp edit to source duration and enforce trimIn < trimOut */
export function normalizeReelEdit(
  edit: ReelEditState,
  sourceDurationSec: number,
): ReelEditState {
  const dur = Math.max(sourceDurationSec, MIN_CLIP_SEC);
  const trimIn = Math.max(0, Math.min(edit.trimInSec, dur - MIN_CLIP_SEC));
  let trimOut =
    edit.trimOutSec == null
      ? dur
      : Math.max(trimIn + MIN_CLIP_SEC, Math.min(edit.trimOutSec, dur));

  if (trimOut <= trimIn) {
    trimOut = Math.min(dur, trimIn + MIN_CLIP_SEC);
  }

  const clipDur = trimOut - trimIn;
  let peak = edit.peakTimeSec;
  if (peak != null) {
    peak = Math.max(0, Math.min(peak, clipDur));
  }

  const markers = edit.markers
    .map((m) => ({
      ...m,
      timeSec: Math.max(0, Math.min(m.timeSec, clipDur)),
    }))
    .sort((a, b) => a.timeSec - b.timeSec);

  let captions = edit.captions;
  if (captions?.length) {
    captions = captions
      .map((c) => ({
        ...c,
        start: Math.max(0, Math.min(c.start, clipDur)),
        end: Math.max(0, Math.min(c.end, clipDur)),
      }))
      .filter((c) => c.end > c.start)
      .sort((a, b) => a.start - b.start);
  }

  return {
    ...edit,
    trimInSec: trimIn,
    trimOutSec: trimOut,
    peakTimeSec: peak,
    markers,
    captions,
  };
}

export function clipDurationSec(edit: ReelEditState): number {
  const out = edit.trimOutSec ?? edit.trimInSec + MIN_CLIP_SEC;
  return Math.max(MIN_CLIP_SEC, out - edit.trimInSec);
}

/** Map timeline time (0 = trim in) to absolute source time */
export function timelineToSourceTime(edit: ReelEditState, timelineSec: number): number {
  return edit.trimInSec + timelineSec;
}

/** Peak for ffmpeg on trimmed source file (starts at 0) */
export function peakOnTrimmedSource(edit: ReelEditState, autoPeakSec: number): number {
  if (edit.peakTimeSec != null) return edit.peakTimeSec;
  const rel = autoPeakSec - edit.trimInSec;
  const clip = clipDurationSec(edit);
  return Math.max(0, Math.min(rel, clip));
}
