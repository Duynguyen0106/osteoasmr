import type { ReelEditState } from "@/lib/contract/reel-edit";
import { clipDurationSec } from "@/lib/reel-edit/normalize";

export function mockReelEditBannerLine(
  edit: ReelEditState,
  sourceDurationSec: number,
): string {
  const clip = clipDurationSec(edit);
  const out = edit.trimOutSec?.toFixed(1) ?? sourceDurationSec.toFixed(1);
  const caps = edit.captions?.length ?? 0;
  const peak =
    edit.peakTimeSec != null
      ? `${edit.peakTimeSec.toFixed(1)}s on clip`
      : "auto peak";
  return `Pending export: ${clip.toFixed(1)}s clip (trim ${edit.trimInSec.toFixed(1)}–${out}s) · ${peak} · ${caps} caption${caps === 1 ? "" : "s"} — switch to server mode to bake.`;
}

export function mockReelEditPipelineLog(edit: ReelEditState): string {
  const clip = clipDurationSec(edit);
  const caps = edit.captions?.length ?? 0;
  return `Reel edit (mock — not exported): ${clip.toFixed(1)}s clip · trim in ${edit.trimInSec.toFixed(1)}s · peak ${edit.peakTimeSec?.toFixed(1) ?? "auto"} · ${caps} captions · set NEXT_PUBLIC_PIPELINE_MODE=server to bake`;
}
