/** Shared envelope analysis (main thread, workers, tests). */

export const ENVELOPE_SIZE = 256;

export interface EnvelopeProfile {
  durationSec: number;
  peakTimeSec: number;
  peakDb: number;
  envelope: number[];
}

function rms(channel: Float32Array, start: number, end: number): number {
  let sum = 0;
  const len = Math.max(1, end - start);
  for (let i = start; i < end; i += 1) {
    const s = channel[i] ?? 0;
    sum += s * s;
  }
  return Math.sqrt(sum / len);
}

export function analyzeChannelEnvelope(
  channel: Float32Array,
  durationSec: number,
): EnvelopeProfile {
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

export function analyzeAudioBufferLike(
  sampleRate: number,
  channel: Float32Array,
  durationSec: number,
): EnvelopeProfile {
  return analyzeChannelEnvelope(channel, durationSec);
}
