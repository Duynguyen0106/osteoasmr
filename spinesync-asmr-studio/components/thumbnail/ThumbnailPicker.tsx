"use client";

import type { SamplePreset } from "@/lib/types";
import { PEAK_TIME_SEC } from "@/lib/waveform";

interface ThumbnailPickerProps {
  preset: SamplePreset;
  eqBoost: number;
}

export function ThumbnailPicker({ preset, eqBoost }: ThumbnailPickerProps) {
  const gain =
    Math.round((preset.freqGainDb + eqBoost * 0.05) * 10) / 10;

  return (
    <div className="glass-panel rounded-2xl p-4">
      <h3 className="mb-3 text-sm font-semibold text-white">
        Auto-Generated Thumbnail
      </h3>
      <div className="relative aspect-video overflow-hidden rounded-xl bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_60%_50%,rgba(34,211,238,0.15),transparent)]" />
        <p className="absolute left-2 top-2 font-mono text-[10px] text-cyan-400">
          00:0{PEAK_TIME_SEC.toFixed(1)}s
        </p>
        <p
          className="absolute left-1/2 top-1/2 max-w-[90%] -translate-x-1/2 -translate-y-1/2 rotate-[-8deg] rounded-lg bg-black/75 px-3 py-2 text-center text-lg font-black uppercase tracking-tight text-yellow-300 shadow-[0_0_30px_rgba(250,204,21,0.35)]"
        >
          {preset.headline}
        </p>
      </div>
      <p className="mt-2 text-[11px] text-slate-500">
        Frame captured at peak sound · Crack Peak: {preset.peakDb} dB · Gain: +
        {gain} dB @ {preset.freqKhz}kHz
      </p>
    </div>
  );
}
