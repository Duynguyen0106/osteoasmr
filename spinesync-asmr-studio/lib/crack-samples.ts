import { crackMixVolume } from "@/lib/asmr-export";
import { getAsmrProfile } from "@/lib/asmr-profiles";
import type { FocusCategory } from "@/lib/types";

export type CrackSampleId = "syn-bright" | "syn-warm" | "syn-deep" | "syn-ribbon";

export interface CrackSampleDef {
  id: CrackSampleId;
  label: string;
  /** High-pass Hz for transient body */
  hp: number;
  /** Low-pass Hz for air */
  lp: number;
  durationSec: number;
  /** Noise vs tonal blend 0–1 */
  noiseMix: number;
  /** Extra gain multiplier vs baseline */
  gainMul: number;
}

export const CRACK_SAMPLES: CrackSampleDef[] = [
  {
    id: "syn-bright",
    label: "Bright joint pop",
    hp: 2800,
    lp: 9500,
    durationSec: 0.08,
    noiseMix: 1,
    gainMul: 1,
  },
  {
    id: "syn-warm",
    label: "Warm thud + crack",
    hp: 1800,
    lp: 7200,
    durationSec: 0.1,
    noiseMix: 0.65,
    gainMul: 1.05,
  },
  {
    id: "syn-deep",
    label: "Deep cavitation",
    hp: 1200,
    lp: 5800,
    durationSec: 0.12,
    noiseMix: 0.85,
    gainMul: 1.15,
  },
  {
    id: "syn-ribbon",
    label: "Ribbon tail (ASMR)",
    hp: 3200,
    lp: 11_000,
    durationSec: 0.07,
    noiseMix: 0.9,
    gainMul: 0.92,
  },
];

export function getCrackSample(id: CrackSampleId | string | undefined): CrackSampleDef {
  const found = CRACK_SAMPLES.find((s) => s.id === id);
  return found ?? CRACK_SAMPLES[0];
}

export function previewCrackGain(
  intensityPercent: number,
  focus: FocusCategory,
  sample: CrackSampleDef,
): number {
  const profile = getAsmrProfile(focus);
  return crackMixVolume(intensityPercent, profile.crackMix) * sample.gainMul;
}

/** Procedural crack transient for Web Audio preview */
export function synthesizeCrackBuffer(
  ctx: BaseAudioContext,
  sample: CrackSampleDef,
): AudioBuffer {
  const sr = ctx.sampleRate;
  const len = Math.max(1, Math.floor(sample.durationSec * sr));
  const buffer = ctx.createBuffer(1, len, sr);
  const data = buffer.getChannelData(0);

  for (let i = 0; i < len; i += 1) {
    const t = i / sr;
    const env = Math.exp(-t / (sample.durationSec * 0.35));
    const noise = (Math.random() * 2 - 1) * sample.noiseMix;
    const tone =
      Math.sin(2 * Math.PI * sample.hp * 1.2 * t) * (1 - sample.noiseMix) * 0.4;
    data[i] = (noise + tone) * env;
  }

  return buffer;
}

export function ffmpegCrackChain(
  sample: CrackSampleDef,
  volume: number,
  delayMs: number,
  label: string,
): string {
  const vol = Math.max(0.01, volume).toFixed(2);
  const d = sample.durationSec.toFixed(2);
  return `anoisesrc=d=${d}:c=white:sample_rate=48000,volume=${vol},highpass=f=${sample.hp},lowpass=f=${sample.lp},afade=t=out:st=${(sample.durationSec * 0.55).toFixed(3)}:d=${(sample.durationSec * 0.35).toFixed(3)},adelay=${delayMs}|${delayMs}[${label}]`;
}
