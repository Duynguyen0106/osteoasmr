import type { BrollOverlay, ReelEditState } from "@/lib/contract/reel-edit";
import { clipDurationSec } from "@/lib/reel-edit/normalize";

const MIN_BROLL_SEC = 0.25;

export type BrollClipExport = {
  assetId: string;
  clipStartSec: number;
  clipEndSec: number;
  brollInSec: number;
  durationSec: number;
};

export function clampBrollRange(
  startSec: number,
  endSec: number,
  sourceDurationSec: number,
): { startSec: number; endSec: number } {
  const dur = Math.max(sourceDurationSec, MIN_BROLL_SEC);
  const s = Math.max(0, Math.min(startSec, dur - MIN_BROLL_SEC));
  let e = Math.max(0, Math.min(endSec, dur));
  if (e <= s) e = Math.min(dur, s + MIN_BROLL_SEC);
  if (e - s < MIN_BROLL_SEC) e = Math.min(dur, s + MIN_BROLL_SEC);
  return { startSec: s, endSec: e };
}

/** Map source-timeline B-roll windows to trimmed clip time for ffmpeg overlay. */
export function brollForTrimmedExport(
  overlays: BrollOverlay[] | undefined,
  edit: ReelEditState,
): BrollClipExport[] {
  if (!overlays?.length) return [];
  const trimIn = edit.trimInSec;
  const trimOut = edit.trimOutSec ?? trimIn + clipDurationSec(edit);

  return overlays
    .filter((o) => o.endSec > trimIn + 0.01 && o.startSec < trimOut - 0.01)
    .map((o) => {
      const clipStartSec = Math.max(0, o.startSec - trimIn);
      const clipEndSec = Math.min(trimOut - trimIn, o.endSec - trimIn);
      const durationSec = Math.max(MIN_BROLL_SEC, clipEndSec - clipStartSec);
      return {
        assetId: o.assetId,
        clipStartSec,
        clipEndSec: clipStartSec + durationSec,
        brollInSec: o.brollInSec,
        durationSec,
      };
    })
    .sort((a, b) => a.clipStartSec - b.clipStartSec);
}

export function moveBrollOverlay(
  overlay: BrollOverlay,
  deltaSec: number,
  sourceDurationSec: number,
): BrollOverlay {
  const span = overlay.endSec - overlay.startSec;
  let startSec = overlay.startSec + deltaSec;
  let endSec = startSec + span;
  if (startSec < 0) {
    startSec = 0;
    endSec = span;
  }
  if (endSec > sourceDurationSec) {
    endSec = sourceDurationSec;
    startSec = Math.max(0, endSec - span);
  }
  return { ...overlay, startSec, endSec };
}
