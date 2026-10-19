import {
  DEFAULT_HASHTAGS,
  buildInstagramCopy,
  buildYoutubeCopy,
  getActivePreset,
} from "@/lib/samples";
import type { CreateJobBody, JobCopyResult } from "@/lib/contract/job";

export function buildJobCopy(
  config: Pick<CreateJobBody, "presetId" | "focus" | "eqBoost">,
  revision: number,
  headline?: string,
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
