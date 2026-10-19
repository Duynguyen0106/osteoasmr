import type { ReelEditState } from "@/lib/contract/reel-edit";
import { clipDurationSec } from "@/lib/reel-edit/normalize";

/** Clip-relative seek (seconds from trimmed clip start) for thumbnail extract. */
export function thumbnailSeekOnClip(
  edit: ReelEditState,
  resolvedPeakOnClipSec: number,
): number {
  const clip = clipDurationSec(edit);
  if (edit.thumbTimeSec != null) {
    return Math.max(0, Math.min(edit.thumbTimeSec, clip));
  }
  return Math.max(0, Math.min(resolvedPeakOnClipSec, clip));
}
