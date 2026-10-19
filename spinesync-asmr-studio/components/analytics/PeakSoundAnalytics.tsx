"use client";

import { Activity } from "lucide-react";
import type { SamplePreset } from "@/lib/types";

interface PeakSoundAnalyticsProps {
  preset: SamplePreset;
  eqBoost: number;
  peakDb?: number;
  freqGainDb?: number;
  freqKhz?: number;
  peakTimeSec?: number;
  sourceLabel?: string;
}

export function PeakSoundAnalytics({
  preset,
  eqBoost,
  peakDb,
  freqGainDb,
  freqKhz,
  peakTimeSec,
  sourceLabel,
}: PeakSoundAnalyticsProps) {
  const gain =
    freqGainDb ??
    Math.round((preset.freqGainDb + eqBoost * 0.05) * 10) / 10;
  const peak = peakDb ?? preset.peakDb;
  const khz = freqKhz ?? preset.freqKhz;

  return (
    <div className="glass-panel rounded-2xl p-4">
      <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
        <Activity className="h-4 w-4 text-cyan-400" />
        Peak Sound Analytics
      </h3>
      <dl className="grid grid-cols-2 gap-3 text-xs">
        <div className="rounded-lg border border-slate-700/50 bg-slate-900/40 p-3">
          <dt className="text-slate-500">Crack Peak</dt>
          <dd className="font-mono text-lg text-cyan-300">{peak} dB</dd>
        </div>
        <div className="rounded-lg border border-purple-500/20 bg-purple-500/5 p-3">
          <dt className="text-slate-500">Frequency Gain</dt>
          <dd className="font-mono text-lg text-purple-200">
            +{gain} dB @ {khz}kHz
          </dd>
        </div>
      </dl>
      {peakTimeSec != null && (
        <p className="mt-3 font-mono text-[10px] text-slate-500">
          Peak @ {peakTimeSec.toFixed(2)}s
          {sourceLabel ? ` · ${sourceLabel}` : ""}
        </p>
      )}
    </div>
  );
}
