import { getAsmrProfile } from "@/lib/asmr-profiles";
import { getActivePreset, getPresetById } from "@/lib/samples";
import { buildJobCopy as buildJobCopyShared } from "@/lib/build-job-copy";
import type { CreateJobBody } from "@/lib/contract/job";

export function buildJobCopy(
  config: CreateJobBody,
  revision: number,
  headline: string,
) {
  return buildJobCopyShared(config, revision, headline);
}

export function presetHeadline(presetId: string | null | undefined, focus: CreateJobBody["focus"]) {
  return getActivePreset(presetId ?? null, focus).headline;
}

export function presetPeakDefaults(
  presetId: string | null | undefined,
  focus: CreateJobBody["focus"],
) {
  const p = getActivePreset(presetId ?? null, focus);
  const profile = getAsmrProfile(focus);
  return {
    peakDb: p.peakDb,
    freqGainDb: p.freqGainDb,
    freqKhz: profile.freqKhz,
  };
}

export function resolvePresetId(presetId: string | null | undefined) {
  if (presetId) return getPresetById(presetId);
  return null;
}
