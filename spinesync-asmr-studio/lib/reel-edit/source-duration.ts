/** When video and decoded audio disagree beyond this, show a sync warning. */
export const DURATION_MISMATCH_SEC = 0.35;

export type SourceDurationKind = "video" | "audio" | "fallback";

export type SourceDurationInput = {
  videoSec?: number;
  audioSec?: number;
  /** Job peak heuristic, preset default, etc. */
  fallbackSec?: number;
};

export type ResolvedSourceDuration = {
  durationSec: number;
  source: SourceDurationKind;
  videoSec: number;
  audioSec: number;
  mismatch: boolean;
  mismatchDeltaSec: number;
};

export function resolveSourceDuration(
  input: SourceDurationInput,
): ResolvedSourceDuration {
  const videoSec = finitePositive(input.videoSec);
  const audioSec = finitePositive(input.audioSec);
  const fallbackSec = finitePositive(input.fallbackSec) ?? 12;

  let durationSec = fallbackSec;
  let source: SourceDurationKind = "fallback";

  if (videoSec != null && videoSec > 0) {
    durationSec = videoSec;
    source = "video";
  } else if (audioSec != null && audioSec > 0) {
    durationSec = audioSec;
    source = "audio";
  }

  const mismatchDeltaSec =
    videoSec != null && audioSec != null
      ? Math.abs(videoSec - audioSec)
      : 0;
  const mismatch =
    videoSec != null &&
    audioSec != null &&
    mismatchDeltaSec > DURATION_MISMATCH_SEC;

  return {
    durationSec: Math.max(durationSec, 0.1),
    source,
    videoSec: videoSec ?? 0,
    audioSec: audioSec ?? 0,
    mismatch,
    mismatchDeltaSec,
  };
}

export function sourceDurationLabel(source: SourceDurationKind): string {
  switch (source) {
    case "video":
      return "video metadata";
    case "audio":
      return "decoded audio";
    default:
      return "estimate";
  }
}

function finitePositive(value: number | undefined): number | null {
  if (value == null || !Number.isFinite(value) || value <= 0) return null;
  return value;
}
