import type { FocusCategory, SamplePreset } from "./types";

export const SAMPLE_PRESETS: SamplePreset[] = [
  {
    id: "neck-crack",
    label: "Neck Crack",
    focus: "neck",
    headline: "INSANE NECK POP 💥",
    subtitles: [
      "WAIT FOR THAT DEEP POP...",
      "LISTEN TO THIS CRACK...",
      "THAT RELEASE THO 🔥",
    ],
    peakDb: -1.2,
    freqGainDb: 6.5,
    freqKhz: 3.5,
  },
  {
    id: "lower-back",
    label: "Lower Back Release",
    focus: "lumbar",
    headline: "LOWER BACK MAGIC ✨",
    subtitles: [
      "FEEL THAT LUMBAR RELEASE...",
      "DEEP TISSUE POP INCOMING...",
      "INSTANT RELIEF ASMR",
    ],
    peakDb: -2.1,
    freqGainDb: 5.8,
    freqKhz: 4.2,
  },
  {
    id: "thoracic-rib",
    label: "Thoracic Rib",
    focus: "thoracic",
    headline: "RIB CAGE RELEASE 💫",
    subtitles: [
      "WAIT FOR THAT RIB POP...",
      "THORACIC MOBILITY ASMR...",
      "DEEP BREATH + CRACK...",
    ],
    peakDb: -1.5,
    freqGainDb: 6.1,
    freqKhz: 3.6,
  },
  {
    id: "shoulder-adj",
    label: "Shoulder Adjustment",
    focus: "shoulder-hip",
    headline: "SHOULDER RESET 🎯",
    subtitles: [
      "WAIT FOR THE SHOULDER DROP...",
      "THAT ALIGNMENT SOUND...",
      "SCAPULA RELEASE ASMR",
    ],
    peakDb: -1.8,
    freqGainDb: 7.2,
    freqKhz: 3.8,
  },
];

export const DEFAULT_HASHTAGS =
  "#Osteopath #ASMR #NeckCrack #SpineAdjustment #BackPainRelief";

export function getPresetById(id: string | null): SamplePreset {
  return SAMPLE_PRESETS.find((p) => p.id === id) ?? SAMPLE_PRESETS[0];
}

export function getActivePreset(
  presetId: string | null,
  focus: FocusCategory,
): SamplePreset {
  if (presetId) return getPresetById(presetId);
  return (
    SAMPLE_PRESETS.find((p) => p.focus === focus) ?? SAMPLE_PRESETS[0]
  );
}

export function buildInstagramCopy(preset: SamplePreset, eqBoost: number): string {
  return `🦴 ${preset.label} ASMR just dropped on SpineSync!

Dr. Smith walks you through a gentle ${preset.focus} adjustment — pure satisfying release energy.

🔊 Frequency boost: +${eqBoost}% (2–6 kHz ASMR band)
📍 Book your session — link in bio

#SpineSync #Osteopathy #Wellness`;
}

export function buildYoutubeCopy(preset: SamplePreset): string {
  return `${preset.label} | Osteopathic ASMR Adjustment (No Talking)

Experience the crisp adjustment sounds captured in 9:16 Shorts format. Practitioner: Dr. Smith @ SpineSync Clinic.

Subscribe for weekly spine ASMR releases.`;
}
