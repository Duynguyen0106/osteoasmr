"use client";

import type { SamplePreset } from "@/lib/types";

interface ThumbnailPickerProps {
  preset: SamplePreset;
  eqBoost: number;
  peakTimeSec?: number;
  peakDb?: number;
  freqGainDb?: number;
  freqKhz?: number;
  thumbUrl?: string | null;
}

export function ThumbnailPicker({
  preset,
  eqBoost,
  peakTimeSec = 4.2,
  peakDb,
  freqGainDb,
  freqKhz,
  thumbUrl,
}: ThumbnailPickerProps) {
  const gain =
    freqGainDb ??
    Math.round((preset.freqGainDb + eqBoost * 0.05) * 10) / 10;
  const peak = peakDb ?? preset.peakDb;
  const khz = freqKhz ?? preset.freqKhz;
  const tsLabel = peakTimeSec.toFixed(1).padStart(4, "0");

  const baked = Boolean(thumbUrl);

  return (
    <div className="glass-panel rounded-2xl p-4">
      <h3 className="mb-3 text-sm font-semibold text-white">
        {baked ? "Branded peak thumbnail" : "Thumbnail preview"}
      </h3>
      <div className="mx-auto max-w-[200px]">
        <div className="relative aspect-[9/16] overflow-hidden rounded-xl bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900">
          {baked ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={thumbUrl!}
              alt="Branded 9:16 peak thumbnail from pipeline export"
              className="absolute inset-0 h-full w-full object-cover"
            />
          ) : (
            <>
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_60%_50%,rgba(34,211,238,0.15),transparent)]" />
              <p className="absolute left-2 top-2 z-10 font-mono text-[10px] text-cyan-400">
                00:{tsLabel}s
              </p>
              <p className="absolute left-1/2 top-1/2 z-10 max-w-[90%] -translate-x-1/2 -translate-y-1/2 rotate-[-8deg] rounded-lg bg-black/75 px-2 py-1.5 text-center text-xs font-black uppercase tracking-tight text-yellow-300 shadow-[0_0_30px_rgba(250,204,21,0.35)]">
                {preset.headline}
              </p>
            </>
          )}
        </div>
      </div>
      <p className="mt-2 text-[11px] text-slate-500">
        {baked
          ? "9:16 JPG from pipeline · headline and contrast baked into export"
          : `Placeholder until server pipeline · peak @ 00:${tsLabel}s · Crack Peak: ${peak} dB · Gain: +${gain} dB @ ${khz}kHz`}
      </p>
    </div>
  );
}
