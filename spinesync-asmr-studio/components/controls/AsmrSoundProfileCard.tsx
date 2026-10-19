"use client";

import { AudioLines } from "lucide-react";
import { ASMR_TARGET_LUFS } from "@/lib/asmr-export";
import { getAsmrProfile, eqBoostToGainDb } from "@/lib/asmr-profiles";
import { CRACK_SAMPLES, type CrackSampleId } from "@/lib/crack-samples";
import type { FocusCategory } from "@/lib/types";

interface AsmrSoundProfileCardProps {
  focus: FocusCategory;
  eqBoost: number;
  crackIntensity: number;
  onCrackIntensityChange: (value: number) => void;
  roomTone: boolean;
  onRoomToneChange: (value: boolean) => void;
  previewBypass: boolean;
  onPreviewBypassChange: (value: boolean) => void;
  exportBypassSculpt: boolean;
  onExportBypassChange: (value: boolean) => void;
  livePreview: boolean;
  onLivePreviewChange: (value: boolean) => void;
  crackSampleId: CrackSampleId;
  onCrackSampleChange: (value: CrackSampleId) => void;
}

export function AsmrSoundProfileCard({
  focus,
  eqBoost,
  crackIntensity,
  onCrackIntensityChange,
  roomTone,
  onRoomToneChange,
  previewBypass,
  onPreviewBypassChange,
  exportBypassSculpt,
  onExportBypassChange,
  livePreview,
  onLivePreviewChange,
  crackSampleId,
  onCrackSampleChange,
}: AsmrSoundProfileCardProps) {
  const profile = getAsmrProfile(focus);
  const gainDb = eqBoostToGainDb(eqBoost);

  return (
    <div className="rounded-xl border border-cyan-500/15 bg-slate-900/40 p-3 space-y-3">
      <div className="flex items-center gap-2 text-xs font-semibold text-white">
        <AudioLines className="h-4 w-4 text-cyan-400" aria-hidden />
        ASMR sound sculpt (Phase 4)
      </div>
      <p className="text-[11px] text-slate-400">{profile.label}</p>
      <p className="font-mono text-[10px] text-cyan-300/90">
        Multiband · 80 Hz HPF · +{gainDb} dB @ {profile.centerHz} Hz · 10 kHz
        shelf · loudnorm {ASMR_TARGET_LUFS} LUFS
      </p>

      <div>
        <label className="mb-1 block text-[11px] text-slate-400">
          Crack sample library
        </label>
        <select
          value={crackSampleId}
          onChange={(e) => onCrackSampleChange(e.target.value as CrackSampleId)}
          className="w-full rounded-lg border border-slate-600/50 bg-slate-950/60 px-2 py-1.5 text-[11px] text-slate-200"
          aria-label="Crack sample"
        >
          {CRACK_SAMPLES.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </select>
        <p className="mt-1 text-[10px] text-slate-500">
          Live preview schedules sample @ peak; export uses same primary + ribbon
          tail.
        </p>
      </div>

      <div>
        <div className="mb-1 flex justify-between text-[11px]">
          <span className="text-slate-400">Crack layer intensity</span>
          <span className="font-mono text-amber-300">{crackIntensity}%</span>
        </div>
        <input
          type="range"
          min={0}
          max={100}
          value={crackIntensity}
          onChange={(e) => onCrackIntensityChange(Number(e.target.value))}
          className="w-full accent-amber-500"
          aria-label="Crack layer intensity"
        />
        <p className="mt-1 text-[10px] text-slate-500">
          Primary + secondary transient @ ~55% of peak when ≥45%
        </p>
      </div>

      <label className="flex cursor-pointer items-start gap-2 text-[11px] text-slate-300">
        <input
          type="checkbox"
          checked={roomTone}
          onChange={(e) => onRoomToneChange(e.target.checked)}
          className="mt-0.5 accent-cyan-500"
        />
        <span>Room tone bed (pink noise ~-36 dBFS mix under voice)</span>
      </label>

      <label className="flex cursor-pointer items-start gap-2 text-[11px] text-slate-300">
        <input
          type="checkbox"
          checked={previewBypass}
          onChange={(e) => onPreviewBypassChange(e.target.checked)}
          className="mt-0.5 accent-purple-500"
        />
        <span>A/B preview bypass — hear raw upload (flat EQ) vs sculpted</span>
      </label>

      <label className="flex cursor-pointer items-start gap-2 text-[11px] text-slate-300">
        <input
          type="checkbox"
          checked={exportBypassSculpt}
          onChange={(e) => onExportBypassChange(e.target.checked)}
          className="mt-0.5 accent-slate-400"
        />
        <span>Export raw audio stem (skip sculpt; loudnorm only)</span>
      </label>

      <label className="flex cursor-pointer items-start gap-2 text-[11px] text-slate-300">
        <input
          type="checkbox"
          checked={livePreview}
          onChange={(e) => onLivePreviewChange(e.target.checked)}
          className="mt-0.5 accent-cyan-500"
        />
        <span>Live Web Audio sculpt on upload preview</span>
      </label>
    </div>
  );
}
