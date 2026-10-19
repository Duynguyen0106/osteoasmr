import {
  DEFAULT_HASHTAGS,
  buildInstagramCopy,
  buildYoutubeCopy,
  getActivePreset,
  getPresetById,
} from "@/lib/samples";
import type { CreateJobBody, JobCopyResult } from "@/lib/contract/job";

export function buildJobCopy(
  config: CreateJobBody,
  revision: number,
  headline: string,
): JobCopyResult {
  const preset = getActivePreset(config.presetId ?? null, config.focus);
  return {
    instagram: buildInstagramCopy(preset, config.eqBoost),
    youtube: buildYoutubeCopy(preset),
    hashtags: DEFAULT_HASHTAGS,
    headline: headline || preset.headline,
    revision,
  };
}

export function presetHeadline(presetId: string | null | undefined, focus: CreateJobBody["focus"]) {
  return getActivePreset(presetId ?? null, focus).headline;
}

export function presetPeakDefaults(
  presetId: string | null | undefined,
  focus: CreateJobBody["focus"],
) {
  const p = getActivePreset(presetId ?? null, focus);
  return {
    peakDb: p.peakDb,
    freqGainDb: p.freqGainDb,
    freqKhz: p.freqKhz,
  };
}

export function resolvePresetId(presetId: string | null | undefined) {
  if (presetId) return getPresetById(presetId);
  return null;
}
