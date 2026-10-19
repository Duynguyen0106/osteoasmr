import type { CaptionSegment } from "@/lib/contract/job";

export const MIN_CAPTION_SEC = 0.12;

export function clampCaptionRange(
  start: number,
  end: number,
  sourceDurationSec: number,
): { start: number; end: number } {
  let s = Math.max(0, start);
  let e = Math.min(sourceDurationSec, end);
  if (e - s < MIN_CAPTION_SEC) {
    e = Math.min(sourceDurationSec, s + MIN_CAPTION_SEC);
  }
  if (e <= s) {
    s = Math.max(0, e - MIN_CAPTION_SEC);
  }
  return { start: s, end: e };
}

export function moveCaptionSegment(
  segment: CaptionSegment,
  deltaSec: number,
  sourceDurationSec: number,
): CaptionSegment {
  const dur = segment.end - segment.start;
  let start = segment.start + deltaSec;
  let end = start + dur;
  if (start < 0) {
    start = 0;
    end = dur;
  }
  if (end > sourceDurationSec) {
    end = sourceDurationSec;
    start = Math.max(0, end - dur);
  }
  return { ...segment, start, end };
}

export function sourceCaptionsToClipPreview(
  captions: CaptionSegment[],
  trimInSec: number,
): CaptionSegment[] {
  return captions
    .map((c) => ({
      ...c,
      start: c.start - trimInSec,
      end: c.end - trimInSec,
    }))
    .filter((c) => c.end > 0 && c.start < 1e6);
}
