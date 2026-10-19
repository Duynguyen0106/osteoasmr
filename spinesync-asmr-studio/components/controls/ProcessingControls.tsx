"use client";

import { SlidersHorizontal } from "lucide-react";
import type { ProcessingToggles } from "@/lib/types";

interface ProcessingControlsProps {
  eqBoost: number;
  onEqBoostChange: (value: number) => void;
  toggles: ProcessingToggles;
  onToggle: (key: keyof ProcessingToggles, value: boolean) => void;
}

function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-700/40 bg-slate-900/30 px-3 py-2">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-1 accent-cyan-500"
      />
      <span>
        <span className="block text-xs font-medium text-slate-200">{label}</span>
        <span className="block text-[11px] text-slate-500">{description}</span>
      </span>
    </label>
  );
}

export function ProcessingControls({
  eqBoost,
  onEqBoostChange,
  toggles,
  onToggle,
}: ProcessingControlsProps) {
  return (
    <div className="glass-panel space-y-4 rounded-2xl p-4">
      <h3 className="flex items-center gap-2 text-sm font-semibold text-white">
        <SlidersHorizontal className="h-4 w-4 text-cyan-400" />
        ASMR Processing Controls
      </h3>

      <div>
        <div className="mb-1 flex justify-between text-xs">
          <span className="text-slate-400">ASMR Frequency Boost (2–6 kHz)</span>
          <span className="font-mono text-cyan-400">+{eqBoost}%</span>
        </div>
        <input
          type="range"
          min={0}
          max={100}
          value={eqBoost}
          onChange={(e) => onEqBoostChange(Number(e.target.value))}
          className="w-full accent-cyan-500"
        />
      </div>

      <div className="space-y-2">
        <ToggleRow
          label="Auto-Detect Peak & Micro-Zoom"
          description="Lock frame + subtle zoom at loudest crack"
          checked={toggles.autoPeakZoom}
          onChange={(v) => onToggle("autoPeakZoom", v)}
        />
        <ToggleRow
          label="Synthesize SFX Crack Layer"
          description="Layer subtle high-frequency crack enhancement"
          checked={toggles.sfxCrack}
          onChange={(v) => onToggle("sfxCrack", v)}
        />
        <ToggleRow
          label="TikTok-Style Subtitle Highlight"
          description="Karaoke yellow word emphasis on captions"
          checked={toggles.tiktokSubs}
          onChange={(v) => onToggle("tiktokSubs", v)}
        />
      </div>
    </div>
  );
}
