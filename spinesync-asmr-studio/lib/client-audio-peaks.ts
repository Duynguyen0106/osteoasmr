import { analyzeChannelEnvelope } from "@/lib/audio/envelope";

export interface AudioPeakProfile {
  durationSec: number;
  peakTimeSec: number;
  peakDb: number;
  /** RMS amplitudes 0–1, fixed resolution across the clip */
  envelope: number[];
}

export function analyzeAudioBuffer(buffer: AudioBuffer): AudioPeakProfile {
  const channel = buffer.getChannelData(0);
  return analyzeChannelEnvelope(channel, buffer.duration);
}

export function envelopeBarHeight(
  barIndex: number,
  barCount: number,
  timeSec: number,
  envelope: number[],
  durationSec: number,
  eqBoost: number,
  sfxCrack: boolean,
  peakTimeSec: number,
): number {
  if (durationSec <= 0 || envelope.length === 0) return 0.2;

  const centerIndex =
    ((timeSec / durationSec) * envelope.length +
      (barIndex / barCount) * envelope.length * 0.15) %
    envelope.length;
  const i0 = Math.floor(centerIndex) % envelope.length;
  const i1 = (i0 + 1) % envelope.length;
  const frac = centerIndex - Math.floor(centerIndex);
  let h = envelope[i0] * (1 - frac) + envelope[i1] * frac;

  if (Math.abs(timeSec - peakTimeSec) <= 0.35) {
    h *= 1.4 + eqBoost / 200;
    if (sfxCrack) h *= 1.1;
  }

  return Math.min(1, Math.max(0.08, h));
}
