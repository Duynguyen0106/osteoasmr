/** EBU R128-ish target for social / Shorts delivery */
export const ASMR_TARGET_LUFS = -14;

export function crackMixVolume(intensityPercent: number, profileCrackMix: number): number {
  const t = Math.max(0, Math.min(100, intensityPercent)) / 100;
  return Number((t * profileCrackMix * 0.85).toFixed(2));
}

export function secondaryCrackDelaySec(peakTimeSec: number): number {
  return Math.max(0, peakTimeSec * 0.55);
}
