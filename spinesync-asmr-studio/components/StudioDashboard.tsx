"use client";

import { useCallback, useState } from "react";
import { Header } from "@/components/layout/Header";
import { PipelineBanner } from "@/components/layout/PipelineBanner";
import { Dropzone } from "@/components/ingestion/Dropzone";
import { SamplePresets } from "@/components/ingestion/SamplePresets";
import { FocusSelector } from "@/components/controls/FocusSelector";
import { ProcessingControls } from "@/components/controls/ProcessingControls";
import { RunPipelineButton } from "@/components/pipeline/RunPipelineButton";
import { TerminalConsole } from "@/components/pipeline/TerminalConsole";
import { VerticalReelPlayer } from "@/components/preview/VerticalReelPlayer";
import { PeakSoundAnalytics } from "@/components/analytics/PeakSoundAnalytics";
import { ThumbnailPicker } from "@/components/thumbnail/ThumbnailPicker";
import { CopywriterTabs } from "@/components/copywriter/CopywriterTabs";
import { SocialDispatchPanel } from "@/components/social/SocialDispatchPanel";
import { usePipeline } from "@/hooks/usePipeline";
import { getPresetById } from "@/lib/samples";
import type { FocusCategory, ProcessingToggles } from "@/lib/types";

export function StudioDashboard() {
  const { pipeline, logs, pipelineComplete, appendLog, runFullPipeline } =
    usePipeline();

  const [file, setFile] = useState<File | null>(null);
  const [presetId, setPresetId] = useState<string | null>("neck-crack");
  const [focus, setFocus] = useState<FocusCategory>("neck");
  const [eqBoost, setEqBoost] = useState(65);
  const [toggles, setToggles] = useState<ProcessingToggles>({
    autoPeakZoom: true,
    sfxCrack: true,
    tiktokSubs: true,
  });

  const preset = getPresetById(presetId);

  const handleFileSelect = useCallback(
    (f: File | null) => {
      setFile(f);
      if (f) {
        setPresetId(null);
        appendLog(`Ingested: ${f.name}`);
      }
    },
    [appendLog],
  );

  const handlePresetSelect = useCallback(
    (id: string) => {
      const p = getPresetById(id);
      setPresetId(id);
      setFile(null);
      setFocus(p.focus);
      appendLog(`Loaded sample: ${p.label}`);
    },
    [appendLog],
  );

  const handleToggle = useCallback(
    (key: keyof ProcessingToggles, value: boolean) => {
      setToggles((t) => ({ ...t, [key]: value }));
    },
    [],
  );

  const handleSocialDispatch = useCallback(
    (action: "immediate" | "queue") => {
      if (action === "immediate") {
        appendLog("Ayrshare · Post Immediately → IG, TikTok, YT Shorts, FB Reels");
      } else {
        appendLog("Ayrshare · Queued for peak hour (18:00 local) · 4 channels");
      }
    },
    [appendLog],
  );

  const canRunPipeline = Boolean(file || presetId);

  return (
    <div className="relative min-h-screen pb-12">
      <div
        className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_top,rgba(168,85,247,0.08),transparent_50%),radial-gradient(ellipse_at_bottom_right,rgba(6,182,212,0.06),transparent_45%)]"
        aria-hidden
      />
      <Header />
      <main className="relative mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6">
        <PipelineBanner
          progress={pipeline.progress}
          stages={pipeline.stages}
          currentStageId={pipeline.currentStageId}
          running={pipeline.running}
        />

        <TerminalConsole logs={logs} />

        <div className="grid gap-6 lg:grid-cols-12">
          <div className="space-y-4 lg:col-span-5">
            <Dropzone file={file} onFileSelect={handleFileSelect} />
            <SamplePresets
              activePresetId={presetId}
              onSelect={handlePresetSelect}
            />
            <div className="glass-panel space-y-4 rounded-2xl p-4">
              <FocusSelector value={focus} onChange={setFocus} />
            </div>
            <ProcessingControls
              eqBoost={eqBoost}
              onEqBoostChange={setEqBoost}
              toggles={toggles}
              onToggle={handleToggle}
            />
            <RunPipelineButton
              running={pipeline.running}
              disabled={!canRunPipeline}
              onRun={runFullPipeline}
            />
            <SocialDispatchPanel
              onDispatch={handleSocialDispatch}
              pipelineComplete={pipelineComplete}
            />
          </div>

          <div className="space-y-4 lg:col-span-7">
            <VerticalReelPlayer
              preset={preset}
              eqBoost={eqBoost}
              tiktokSubs={toggles.tiktokSubs}
            />
            <div className="grid gap-4 md:grid-cols-2">
              <PeakSoundAnalytics preset={preset} eqBoost={eqBoost} />
              <ThumbnailPicker preset={preset} eqBoost={eqBoost} />
            </div>
            <CopywriterTabs presetId={presetId} eqBoost={eqBoost} />
          </div>
        </div>
      </main>
    </div>
  );
}
