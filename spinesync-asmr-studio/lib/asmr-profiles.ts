import type { FocusCategory } from "@/lib/types";

export interface AsmrFocusProfile {
  focus: FocusCategory;
  label: string;
  centerHz: number;
  /** ffmpeg equalizer width (Hz) */
  widthHz: number;
  /** UI / analytics display */
  freqKhz: number;
  /** Web Audio peaking Q */
  q: number;
  /** Crack layer volume 0–1 when SFX enabled */
  crackMix: number;
}

export const ASMR_FOCUS_PROFILES: Record<FocusCategory, AsmrFocusProfile> = {
  neck: {
    focus: "neck",
    label: "Cervical crack band",
    centerHz: 4200,
    widthHz: 1800,
    freqKhz: 4.2,
    q: 1.4,
    crackMix: 0.72,
  },
  thoracic: {
    focus: "thoracic",
    label: "Thoracic mid-band",
    centerHz: 3500,
    widthHz: 2000,
    freqKhz: 3.5,
    q: 1.2,
    crackMix: 0.65,
  },
  lumbar: {
    focus: "lumbar",
    label: "Lumbar thump + crack",
    centerHz: 2800,
    widthHz: 2200,
    freqKhz: 2.8,
    q: 1.0,
    crackMix: 0.58,
  },
  "shoulder-hip": {
    focus: "shoulder-hip",
    label: "Shoulder–hip presence",
    centerHz: 3200,
    widthHz: 2400,
    freqKhz: 3.2,
    q: 1.1,
    crackMix: 0.62,
  },
};

export function getAsmrProfile(focus: FocusCategory): AsmrFocusProfile {
  return ASMR_FOCUS_PROFILES[focus];
}

/** Map UI EQ boost 0–100 → peaking gain dB (max ~12 dB). */
export function eqBoostToGainDb(eqBoost: number): number {
  return Math.round((eqBoost / 100) * 12 * 10) / 10;
}

export function buildFfmpegEqualizer(focus: FocusCategory, gainDb: number): string {
  const p = getAsmrProfile(focus);
  return `equalizer=f=${p.centerHz}:t=h:width=${p.widthHz}:g=${gainDb}`;
}
