"use client";

import { BookmarkPlus, Loader2, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import type { AsmrPresetRecord } from "@/lib/contract/asmr-preset";
import { spinesyncFetch } from "@/lib/api-client";
import type { CrackSampleId } from "@/lib/crack-samples";
import type { FocusCategory, ProcessingToggles } from "@/lib/types";

export interface AsmrStudioSettings {
  focus: FocusCategory;
  eqBoost: number;
  crackIntensity: number;
  roomTone: boolean;
  previewBypass: boolean;
  exportBypassSculpt: boolean;
  crackSampleId: CrackSampleId;
  toggles: ProcessingToggles;
  liveAsmrPreview: boolean;
}

interface AsmrPresetPanelProps {
  settings: AsmrStudioSettings;
  onApply: (settings: AsmrStudioSettings) => void;
  enabled: boolean;
}

export function AsmrPresetPanel({ settings, onApply, enabled }: AsmrPresetPanelProps) {
  const [presets, setPresets] = useState<AsmrPresetRecord[]>([]);
  const [saving, setSaving] = useState(false);
  const [selectedId, setSelectedId] = useState<string>("");
  const [name, setName] = useState("Clinic default");

  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    spinesyncFetch("/api/asmr-presets")
      .then(async (res) => {
        if (!res.ok || cancelled) return null;
        return (await res.json()) as { presets: AsmrPresetRecord[] };
      })
      .then((data) => {
        if (!cancelled && data) {
          setPresets(data.presets);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [enabled, refreshKey]);

  const payloadFromSettings = useCallback(
    () => ({
      name: name.trim() || "Untitled preset",
      focus: settings.focus,
      eqBoost: settings.eqBoost,
      crackIntensity: settings.crackIntensity,
      roomTone: settings.roomTone,
      bypassSculpt: settings.previewBypass,
      exportBypassSculpt: settings.exportBypassSculpt,
      crackSampleId: settings.crackSampleId,
      toggles: settings.toggles,
      liveAsmrPreview: settings.liveAsmrPreview,
    }),
    [name, settings],
  );

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await spinesyncFetch("/api/asmr-presets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payloadFromSettings()),
      });
      if (res.ok) {
        setRefreshKey((k) => k + 1);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleApply = () => {
    const preset = presets.find((p) => p.id === selectedId);
    if (!preset) return;
    onApply({
      focus: preset.focus,
      eqBoost: preset.eqBoost,
      crackIntensity: preset.crackIntensity,
      roomTone: preset.roomTone,
      previewBypass: preset.bypassSculpt,
      exportBypassSculpt: preset.exportBypassSculpt,
      crackSampleId: preset.crackSampleId,
      toggles: preset.toggles,
      liveAsmrPreview: preset.liveAsmrPreview ?? true,
    });
  };

  const handleDelete = async () => {
    if (!selectedId) return;
    const res = await spinesyncFetch(
      `/api/asmr-presets?id=${encodeURIComponent(selectedId)}`,
      { method: "DELETE" },
    );
    if (res.ok) {
      setSelectedId("");
      setRefreshKey((k) => k + 1);
    }
  };

  if (!enabled) {
    return (
      <div className="rounded-xl border border-slate-700/40 bg-slate-900/30 p-3 text-[11px] text-slate-500">
        ASMR presets (SQLite) available in server pipeline mode.
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-emerald-500/15 bg-slate-900/40 p-3 space-y-3">
      <div className="flex items-center gap-2 text-xs font-semibold text-white">
        <BookmarkPlus className="h-4 w-4 text-emerald-400" aria-hidden />
        Project ASMR presets (Phase 4)
      </div>

      <div className="flex gap-2">
        <select
          value={selectedId}
          onChange={(e) => setSelectedId(e.target.value)}
          className="flex-1 rounded-lg border border-slate-600/50 bg-slate-950/60 px-2 py-1.5 text-[11px] text-slate-200"
          aria-label="Saved ASMR preset"
        >
          <option value="">Select preset…</option>
          {presets.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} · {p.focus}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={handleApply}
          disabled={!selectedId}
          className="rounded-lg bg-emerald-600/80 px-3 py-1.5 text-[11px] font-semibold text-white disabled:opacity-40"
        >
          Load
        </button>
        <button
          type="button"
          onClick={() => void handleDelete()}
          disabled={!selectedId}
          aria-label="Delete preset"
          className="rounded-lg border border-red-500/30 px-2 py-1.5 text-red-300 disabled:opacity-40"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Preset name"
          className="flex-1 rounded-lg border border-slate-600/50 bg-slate-950/60 px-2 py-1.5 text-[11px] text-slate-200"
          aria-label="Preset name"
        />
        <button
          type="button"
          onClick={() => void handleSave()}
          disabled={saving}
          className="rounded-lg bg-cyan-600/80 px-3 py-1.5 text-[11px] font-semibold text-white disabled:opacity-40"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save current"}
        </button>
      </div>

    </div>
  );
}
