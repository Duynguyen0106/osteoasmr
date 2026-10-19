"use client";

import { AudioLines } from "lucide-react";
import { getAsmrProfile, eqBoostToGainDb } from "@/lib/asmr-profiles";
import type { FocusCategory } from "@/lib/types";

interface AsmrSoundProfileCardProps {
  focus: FocusCategory;
  eqBoost: number;
  livePreview: boolean;
  onLivePreviewChange: (value: boolean) => void;
}

export function AsmrSoundProfileCard({
  focus,
  eqBoost,
  livePreview,
  onLivePreviewChange,
}: AsmrSoundProfileCardProps) {
  const profile = getAsmrProfile(focus);
  const gainDb = eqBoostToGainDb(eqBoost);

  return (
    <div className="rounded-xl border border-cyan-500/15 bg-slate-900/40 p-3">
      <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-white">
        <AudioLines className="h-4 w-4 text-cyan-400" aria-hidden />
        ASMR sound profile
      </div>
      <p className="text-[11px] text-slate-400">{profile.label}</p>
      <p className="mt-1 font-mono text-[10px] text-cyan-300/90">
        Peaking +{gainDb} dB @ {profile.centerHz} Hz · Q {profile.q}
      </p>
      <label className="mt-3 flex cursor-pointer items-start gap-2 text-[11px] text-slate-300">
        <input
          type="checkbox"
          checked={livePreview}
          onChange={(e) => onLivePreviewChange(e.target.checked)}
          className="mt-0.5 accent-cyan-500"
        />
        <span>
          Live sculpt preview (Web Audio) while watching upload — matches server EQ
          band before pipeline finishes.
        </span>
      </label>
    </div>
  );
}
