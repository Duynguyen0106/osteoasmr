"use client";

import { useCallback, useMemo, useState } from "react";
import { AuthBootstrap } from "@/components/layout/AuthBootstrap";
import { Header } from "@/components/layout/Header";
import { PipelineBanner } from "@/components/layout/PipelineBanner";
import { IngestionPanel } from "@/components/ingestion/IngestionPanel";
import { FocusSelector } from "@/components/controls/FocusSelector";
import { AsmrSoundProfileCard } from "@/components/controls/AsmrSoundProfileCard";
import { ProcessingControls } from "@/components/controls/ProcessingControls";
import { RunPipelineButton } from "@/components/pipeline/RunPipelineButton";
import { TerminalConsole } from "@/components/pipeline/TerminalConsole";
import { VerticalReelPlayer } from "@/components/preview/VerticalReelPlayer";
import { PeakSoundAnalytics } from "@/components/analytics/PeakSoundAnalytics";
import { ThumbnailPicker } from "@/components/thumbnail/ThumbnailPicker";
import { CopywriterTabs } from "@/components/copywriter/CopywriterTabs";
import { SocialDispatchPanel } from "@/components/social/SocialDispatchPanel";
import { useMediaObjectUrl } from "@/hooks/useMediaObjectUrl";
import { usePipeline } from "@/hooks/usePipeline";
import { usePipelineServer } from "@/hooks/usePipelineServer";
import { isServerPipeline } from "@/lib/pipeline-mode";
import { getActivePreset, getPresetById } from "@/lib/samples";
import { PEAK_TIME_SEC } from "@/lib/waveform";
import type { FocusCategory, ProcessingToggles } from "@/lib/types";

import { JobExportsPanel } from "@/components/export/JobExportsPanel";
import { JobHistoryPanel } from "@/components/jobs/JobHistoryPanel";
import { useSourceAudioProfile } from "@/hooks/useSourceAudioProfile";
import { spinesyncFetch } from "@/lib/api-client";
import { uploadAssetSmart } from "@/lib/upload-client";

export function StudioDashboard() {
  const [file, setFile] = useState<File | null>(null);
  const [assetId, setAssetId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const localVideoUrl = useMediaObjectUrl(file);
  const { profile: sourceAudio, loading: audioAnalyzing } = useSourceAudioProfile(file);
  const [serverPeakTimeSec, setServerPeakTimeSec] = useState<number | null>(null);
  const [presetId, setPresetId] = useState<string | null>("neck-crack");
  const [focus, setFocus] = useState<FocusCategory>("neck");
  const [eqBoost, setEqBoost] = useState(65);
  const [toggles, setToggles] = useState<ProcessingToggles>({
    autoPeakZoom: true,
    sfxCrack: true,
    tiktokSubs: true,
  });
  const [liveAsmrPreview, setLiveAsmrPreview] = useState(true);

  const mock = usePipeline();
  const server = usePipelineServer({
    assetId,
    onNeedAsset: async () => {
      if (file) {
        const id = await uploadAssetSmart(file);
        setAssetId(id);
        return id;
      }
      return null;
    },
  });

  const active = isServerPipeline ? server : mock;
  const {
    pipeline,
    logs,
    pipelineComplete,
    copyRevision,
    appendLog,
    runFullPipeline,
  } = active;

  const jobResult = isServerPipeline ? server.jobResult : null;
  const serverCopy = isServerPipeline
    ? server.serverCopy
    : mock.mockCopy;
  const refreshJobMedia = isServerPipeline
    ? server.refreshJobMedia
    : undefined;

  const preset = getActivePreset(presetId, focus);
  const peakTimeSec =
    jobResult?.peak.timeSec ??
    serverPeakTimeSec ??
    (sourceAudio.envelope.length ? sourceAudio.peakTimeSec : PEAK_TIME_SEC);

  const peakSourceLabel = jobResult
    ? "pipeline"
    : sourceAudio.envelope.length
      ? "upload (Web Audio)"
      : serverPeakTimeSec != null
        ? "upload (ffmpeg)"
        : undefined;

  const previewVideoUrl = useMemo(() => {
    if (jobResult?.previewUrls?.reel) return jobResult.previewUrls.reel;
    return localVideoUrl;
  }, [jobResult, localVideoUrl]);

  const handleFileSelect = useCallback(
    async (f: File | null) => {
      setFile(f);
      setAssetId(null);
      setServerPeakTimeSec(null);
      if (!f) {
        appendLog("Upload cleared · select a sample or drop new media");
        return;
      }
      setPresetId(null);
      appendLog(`Ingested: ${f.name}`);
      if (isServerPipeline) {
        setUploading(true);
        try {
          const id = await uploadAssetSmart(f);
          setAssetId(id);
          appendLog(`Server asset registered · ${id.slice(0, 8)}…`);
          try {
            const analyze = await spinesyncFetch(`/api/assets/${id}/analyze`);
            if (analyze.ok) {
              const data = (await analyze.json()) as { peakTimeSec: number };
              setServerPeakTimeSec(data.peakTimeSec);
              appendLog(
                `Peak scan · ${data.peakTimeSec.toFixed(2)}s (server ffmpeg)`,
              );
            }
          } catch {
            /* client Web Audio profile still applies */
          }
        } catch (err) {
          appendLog(
            `Upload failed: ${err instanceof Error ? err.message : "unknown"}`,
          );
        } finally {
          setUploading(false);
        }
      }
    },
    [appendLog],
  );

  const handleInvalidFile = useCallback(
    (fileName: string) => {
      appendLog(`Rejected ingest: ${fileName} (MP4/MOV only)`);
    },
    [appendLog],
  );

  const handlePresetSelect = useCallback(
    (id: string) => {
      const p = getPresetById(id);
      setPresetId(id);
      setFile(null);
      setAssetId(null);
      setFocus(p.focus);
      appendLog(`Loaded sample: ${p.label}`);
    },
    [appendLog],
  );

  const handleFocusChange = useCallback(
    (next: FocusCategory) => {
      setFocus(next);
      if (presetId) {
        const current = getPresetById(presetId);
        if (current.focus !== next) {
          setPresetId(null);
          appendLog(`Focus → ${next} · adaptive ASMR profile applied`);
        }
      }
    },
    [appendLog, presetId],
  );

  const handleToggle = useCallback(
    (key: keyof ProcessingToggles, value: boolean) => {
      setToggles((t) => ({ ...t, [key]: value }));
    },
    [],
  );

  const handleSocialDispatch = useCallback(
    (action: "immediate" | "queue") => {
      if (isServerPipeline) {
        void server.publish(action);
        return;
      }
      if (action === "immediate") {
        appendLog(
          "Ayrshare · Post Immediately → IG, TikTok, YT Shorts, FB Reels",
        );
      } else {
        appendLog("Ayrshare · Queued for peak hour (18:00 local) · 4 channels");
      }
    },
    [appendLog, server],
  );

  const canRunPipeline =
    Boolean(file || presetId || focus) && !uploading && !pipeline.running;

  const handleRunPipeline = useCallback(() => {
    if (isServerPipeline) {
      void server.runFullPipeline({
        eqBoost,
        toggles,
        focus,
        sourceLabel: file?.name ?? preset.label,
        presetId,
      });
      return;
    }
    runFullPipeline({
      eqBoost,
      toggles,
      focus,
      sourceLabel: file?.name ?? preset.label,
      presetId,
    });
  }, [
    eqBoost,
    toggles,
    focus,
    file,
    preset.label,
    presetId,
    runFullPipeline,
    server,
  ]);

  return (
    <div className="relative min-h-screen pb-12">
      {isServerPipeline && <AuthBootstrap />}
      <div
        className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_top,rgba(168,85,247,0.08),transparent_50%),radial-gradient(ellipse_at_bottom_right,rgba(6,182,212,0.06),transparent_45%)]"
        aria-hidden
      />
      <Header />
      {isServerPipeline && (
        <p className="relative mx-auto max-w-7xl px-4 pt-2 text-center text-[10px] uppercase tracking-widest text-emerald-400/90 sm:px-6">
          Server pipeline · SQLite + ffmpeg · SSE logs
        </p>
      )}
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
            <IngestionPanel
              file={file}
              activePresetId={presetId}
              onFileSelect={(f) => void handleFileSelect(f)}
              onPresetSelect={handlePresetSelect}
              onInvalidFile={handleInvalidFile}
            />
            <div className="glass-panel rounded-2xl p-4">
              <FocusSelector value={focus} onChange={handleFocusChange} />
            </div>
            <ProcessingControls
              eqBoost={eqBoost}
              onEqBoostChange={setEqBoost}
              toggles={toggles}
              onToggle={handleToggle}
            />
            <AsmrSoundProfileCard
              focus={focus}
              eqBoost={eqBoost}
              livePreview={liveAsmrPreview}
              onLivePreviewChange={setLiveAsmrPreview}
            />
            <RunPipelineButton
              running={pipeline.running || uploading}
              disabled={!canRunPipeline}
              onRun={handleRunPipeline}
            />
            <SocialDispatchPanel
              onDispatch={handleSocialDispatch}
              pipelineComplete={pipelineComplete}
            />
            {isServerPipeline && (
              <JobHistoryPanel
                activeJobId={server.jobId}
                refreshKey={server.historyTick}
                onOpenJob={(id) => void server.loadJob(id)}
              />
            )}
          </div>

          <div className="space-y-4 lg:col-span-7">
            <VerticalReelPlayer
              key={`${previewVideoUrl ?? "sample"}-${preset.id}-${peakTimeSec}-${liveAsmrPreview}`}
              preset={preset}
              eqBoost={eqBoost}
              tiktokSubs={toggles.tiktokSubs}
              autoPeakZoom={toggles.autoPeakZoom}
              sfxCrack={toggles.sfxCrack}
              videoUrl={previewVideoUrl}
              peakTimeSec={peakTimeSec}
              captionSegments={jobResult?.captionSegments ?? null}
              audioEnvelope={
                sourceAudio.envelope.length ? sourceAudio.envelope : null
              }
              audioDurationSec={sourceAudio.durationSec}
              focus={focus}
              liveAsmrPreview={liveAsmrPreview && Boolean(previewVideoUrl) && !jobResult?.previewUrls?.reel}
              onRefreshMedia={
                refreshJobMedia
                  ? () => {
                      void refreshJobMedia();
                    }
                  : undefined
              }
            />
            <div className="grid gap-4 md:grid-cols-2">
              <PeakSoundAnalytics
                preset={preset}
                eqBoost={eqBoost}
                peakDb={jobResult?.peak.peakDb ?? sourceAudio.peakDb}
                freqGainDb={jobResult?.peak.freqGainDb}
                freqKhz={jobResult?.peak.freqKhz}
                peakTimeSec={peakTimeSec}
                sourceLabel={peakSourceLabel}
              />
              <ThumbnailPicker
                preset={preset}
                eqBoost={eqBoost}
                peakTimeSec={peakTimeSec}
                peakDb={jobResult?.peak.peakDb}
                freqGainDb={jobResult?.peak.freqGainDb}
                freqKhz={jobResult?.peak.freqKhz}
                thumbUrl={jobResult?.previewUrls?.thumb ?? null}
              />
            </div>
            <CopywriterTabs
              preset={preset}
              eqBoost={eqBoost}
              copyRevision={copyRevision}
              serverCopy={serverCopy}
            />
            <JobExportsPanel
              jobResult={jobResult}
              pipelineComplete={pipelineComplete}
            />
            {audioAnalyzing && file && (
              <p className="text-center text-[10px] text-cyan-400/80">
                Decoding upload audio for live waveform…
              </p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
