"use client";

import { SAMPLE_PRESETS } from "@/lib/samples";

interface SamplePresetsProps {
  activePresetId: string | null;
  onSelect: (presetId: string) => void;
}

export function SamplePresets({ activePresetId, onSelect }: SamplePresetsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <span className="w-full text-xs text-slate-500">Instant test samples:</span>
      {SAMPLE_PRESETS.map((preset) => (
        <button
          key={preset.id}
          type="button"
          onClick={() => onSelect(preset.id)}
          className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
            activePresetId === preset.id
              ? "border-cyan-400 bg-cyan-500/20 text-cyan-200"
              : "border-slate-600/60 bg-slate-900/40 text-slate-300 hover:border-cyan-500/40"
          }`}
        >
          {preset.label}
        </button>
      ))}
    </div>
  );
}
