import { envelopeBarHeight } from "./client-audio-peaks";

export const PEAK_TIME_SEC = 4.2;
export const PEAK_WINDOW_SEC = 0.35;

export function isNearPeak(
  playbackTimeSec: number,
  peakTimeSec = PEAK_TIME_SEC,
): boolean {
  return Math.abs(playbackTimeSec - peakTimeSec) <= PEAK_WINDOW_SEC;
}

export function barHeight(
  index: number,
  barCount: number,
  timeSec: number,
  eqBoost: number,
  sfxCrack = false,
  peakTimeSec = PEAK_TIME_SEC,
  envelope?: number[] | null,
  durationSec?: number,
): number {
  if (envelope?.length && durationSec && durationSec > 0) {
    return envelopeBarHeight(
      index,
      barCount,
      timeSec,
      envelope,
      durationSec,
      eqBoost,
      sfxCrack,
      peakTimeSec,
    );
  }
  const phase = timeSec * 8 + index * 0.35;
  const base = 0.25 + Math.abs(Math.sin(phase)) * 0.35;
  const noise = Math.abs(Math.sin(index * 1.7 + timeSec * 3)) * 0.2;
  let h = base + noise;

  if (sfxCrack) {
    h += Math.abs(Math.sin(index * 2.8 + timeSec * 14)) * 0.12;
  }

  if (isNearPeak(timeSec, peakTimeSec)) {
    const peakBoost = 1 + eqBoost / 100;
    h *= 1.6 * peakBoost;
    if (sfxCrack) h *= 1.15;
  }

  return Math.min(1, h);
}
