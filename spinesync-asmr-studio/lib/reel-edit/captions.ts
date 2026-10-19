import type { CaptionSegment } from "@/lib/contract/job";
import type { ReelEditState } from "@/lib/contract/reel-edit";
import { clipDurationSec } from "@/lib/reel-edit/normalize";

function shiftWords(
  words: CaptionSegment["words"],
  deltaSec: number,
): CaptionSegment["words"] {
  if (!words?.length) return words;
  return words.map((w) => ({
    ...w,
    start: w.start + deltaSec,
    end: w.end + deltaSec,
  }));
}

/** Heuristic: job captions are usually clip-relative after export */
export function captionsLookClipRelative(
  captions: CaptionSegment[],
  sourceDurationSec: number,
): boolean {
  if (!captions.length) return true;
  const maxEnd = Math.max(...captions.map((c) => c.end));
  return maxEnd <= sourceDurationSec * 0.55 && maxEnd <= 120;
}

/** Convert clip-relative segments to source-absolute for the timeline + trim */
export function clipCaptionsToSource(
  captions: CaptionSegment[],
  trimInSec: number,
): CaptionSegment[] {
  return captions.map((c) => ({
    ...c,
    start: c.start + trimInSec,
    end: c.end + trimInSec,
    words: shiftWords(c.words, trimInSec),
  }));
}

/** Clip-relative segments for ffmpeg/VTT on trimmed source */
export function captionsForTrimmedExport(
  captions: CaptionSegment[] | undefined,
  edit: ReelEditState,
): CaptionSegment[] | undefined {
  if (!captions?.length) return undefined;
  const trimIn = edit.trimInSec;
  const trimOut = edit.trimOutSec ?? trimIn + clipDurationSec(edit);

  const filtered = captions
    .filter((c) => c.end > trimIn && c.start < trimOut)
    .map((c) => ({
      ...c,
      start: Math.max(0, c.start - trimIn),
      end: Math.max(0, Math.min(trimOut - trimIn, c.end - trimIn)),
      words: c.words
        ?.map((w) => ({
          ...w,
          start: Math.max(0, w.start - trimIn),
          end: Math.max(0, Math.min(trimOut - trimIn, w.end - trimIn)),
        }))
        .filter((w) => w.end > w.start),
    }))
    .filter((c) => c.end > c.start);

  return filtered.length ? filtered : undefined;
}

export function importCaptionsForEditor(
  segments: CaptionSegment[] | null | undefined,
  edit: ReelEditState,
  sourceDurationSec: number,
): CaptionSegment[] | undefined {
  if (!segments?.length) return undefined;
  if (captionsLookClipRelative(segments, sourceDurationSec)) {
    return clipCaptionsToSource(segments, edit.trimInSec);
  }
  return segments;
}
