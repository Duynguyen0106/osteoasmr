export interface AudioPeakProfile {
  durationSec: number;
  peakTimeSec: number;
  peakDb: number;
  /** RMS amplitudes 0–1, fixed resolution across the clip */
  envelope: number[];
}

const ENVELOPE_SIZE = 256;

function rms(channel: Float32Array, start: number, end: number): number {
  let sum = 0;
  const len = Math.max(1, end - start);
  for (let i = start; i < end; i += 1) {
    const s = channel[i] ?? 0;
    sum += s * s;
  }
  return Math.sqrt(sum / len);
}

export function analyzeAudioBuffer(buffer: AudioBuffer): AudioPeakProfile {
  const channel = buffer.getChannelData(0);
  const durationSec = buffer.duration;
  const envelope: number[] = [];
  let maxRms = 0;
  let maxIndex = 0;

  for (let i = 0; i < ENVELOPE_SIZE; i += 1) {
    const startSample = Math.floor((i / ENVELOPE_SIZE) * channel.length);
    const endSample = Math.floor(((i + 1) / ENVELOPE_SIZE) * channel.length);
    const value = rms(channel, startSample, endSample);
    envelope.push(value);
    if (value > maxRms) {
      maxRms = value;
      maxIndex = i;
    }
  }

  const peakTimeSec =
    maxIndex > 0
      ? (maxIndex / ENVELOPE_SIZE) * durationSec
      : Math.min(4.2, durationSec * 0.35);

  const peakDb = maxRms > 0 ? 20 * Math.log10(maxRms) : -60;
  const maxEnv = Math.max(...envelope, 0.0001);
  const normalized = envelope.map((v) => v / maxEnv);

  return {
    durationSec,
    peakTimeSec,
    peakDb,
    envelope: normalized,
  };
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
