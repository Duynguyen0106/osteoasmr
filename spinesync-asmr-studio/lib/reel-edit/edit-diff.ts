import type { ReelEditState } from "@/lib/contract/reel-edit";
import { defaultReelEdit } from "@/lib/contract/reel-edit";
import { clipDurationSec } from "@/lib/reel-edit/normalize";

const EPS = 0.05;

/** True when user changed something beyond a full-clip default */
export function hasMeaningfulEdit(
  edit: ReelEditState | null | undefined,
  sourceDurationSec: number,
): boolean {
  if (!edit) return false;
  const base = defaultReelEdit(sourceDurationSec);
  const clip = clipDurationSec(edit);
  const baseClip = clipDurationSec(base);

  if (edit.trimInSec > EPS) return true;
  if (
    edit.trimOutSec != null &&
    edit.trimOutSec < sourceDurationSec - EPS
  ) {
    return true;
  }
  if (Math.abs(clip - baseClip) > EPS) return true;
  if (edit.peakTimeSec != null) return true;
  if (edit.thumbTimeSec != null) return true;
  if (edit.captions?.length) return true;
  if (edit.markers.length > 0) return true;
  if ((edit.brollOverlays?.length ?? 0) > 0) return true;
  if (edit.zoomIntensity !== base.zoomIntensity) return true;
  return false;
}
