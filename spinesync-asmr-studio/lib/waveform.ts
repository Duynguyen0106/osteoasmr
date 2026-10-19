export const PEAK_TIME_SEC = 4.2;
export const PEAK_WINDOW_SEC = 0.35;

export function isNearPeak(playbackTimeSec: number): boolean {
  return Math.abs(playbackTimeSec - PEAK_TIME_SEC) <= PEAK_WINDOW_SEC;
}

export function barHeight(
  index: number,
  barCount: number,
  timeSec: number,
  eqBoost: number,
): number {
  const phase = timeSec * 8 + index * 0.35;
  const base = 0.25 + Math.abs(Math.sin(phase)) * 0.35;
  const noise = Math.abs(Math.sin(index * 1.7 + timeSec * 3)) * 0.2;
  let h = base + noise;

  if (isNearPeak(timeSec)) {
    const peakBoost = 1 + eqBoost / 100;
    h *= 1.6 * peakBoost;
  }

  return Math.min(1, h);
}
