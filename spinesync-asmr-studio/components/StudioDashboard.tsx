"use client";

import { useCallback, useMemo, useState } from "react";
import { useReelEditPersistence } from "@/hooks/useReelEditPersistence";
import { savePersistedReelEdit } from "@/lib/reel-edit/persist";
import { ApiKeyPanel } from "@/components/layout/ApiKeyPanel";
import { StudioOpsPanels } from "@/components/layout/StudioOpsPanels";
import { AuthBootstrap } from "@/components/layout/AuthBootstrap";
import { Header } from "@/components/layout/Header";
import { StudioCapabilityBanner } from "@/components/layout/StudioCapabilityBanner";
import { PipelineBanner } from "@/components/layout/PipelineBanner";
import { IngestionPanel } from "@/components/ingestion/IngestionPanel";
import { FocusSelector } from "@/components/controls/FocusSelector";
import { AsmrPresetPanel } from "@/components/controls/AsmrPresetPanel";
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
import type { CrackSampleId } from "@/lib/crack-samples";
import type { AsmrStudioSettings } from "@/components/controls/AsmrPresetPanel";
import type { FocusCategory, ProcessingToggles } from "@/lib/types";

import { JobExportsPanel } from "@/components/export/JobExportsPanel";
import { JobHistoryPanel } from "@/components/jobs/JobHistoryPanel";
import { useSourceAudioProfile } from "@/hooks/useSourceAudioProfile";
import { spinesyncFetch } from "@/lib/api-client";
import { uploadAssetSmart } from "@/lib/upload-client";
import { useStudioHealth } from "@/hooks/useStudioHealth";
import { ReelProEditor } from "@/components/editor/ReelProEditor";
import {
  StudioViewTabs,
  type StudioView,
} from "@/components/layout/StudioViewTabs";
import type { ReelEditState } from "@/lib/contract/reel-edit";
import { defaultReelEdit } from "@/lib/contract/reel-edit";
import { sourceCaptionsToClipPreview } from "@/lib/reel-edit/caption-timing";
import { hasMeaningfulEdit } from "@/lib/reel-edit/edit-diff";
import { normalizeReelEdit } from "@/lib/reel-edit/normalize";

export function StudioDashboard() {
  const [file, setFile] = useState<File | null>(null);
  const [assetId, setAssetId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const localVideoUrl = useMediaObjectUrl(file);
  const {
    profile: sourceAudio,
    loading: audioAnalyzing,
    decodedViaWorker,
  } = useSourceAudioProfile(file);
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
  const [crackIntensity, setCrackIntensity] = useState(65);
  const [roomTone, setRoomTone] = useState(false);
  const [previewBypass, setPreviewBypass] = useState(false);
  const [exportBypassSculpt, setExportBypassSculpt] = useState(false);
  const [crackSampleId, setCrackSampleId] = useState<CrackSampleId>("syn-bright");
  const [studioView, setStudioView] = useState<StudioView>("pipeline");
  const [reelEdit, setReelEdit] = useState<ReelEditState | null>(null);
  const [editorBootKey, setEditorBootKey] = useState(0);
  const [editorSeekClipSec, setEditorSeekClipSec] = useState<number | null>(null);
  const [videoSourceDurationSec, setVideoSourceDurationSec] = useState(0);

  const bumpEditorFromStoredEdit = useCallback((edit: ReelEditState) => {
    setReelEdit(edit);
    setEditorBootKey((k) => k + 1);
  }, []);

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

  const { health: studioHealth, error: healthError } = useStudioHealth(
    isServerPipeline,
  );

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
  const sourceDurationSec = Math.max(
    sourceAudio.durationSec,
    videoSourceDurationSec,
    jobResult?.peak.timeSec ? jobResult.peak.timeSec * 2 : 0,
    0.1,
  ) || 12;

  const onPersistedEditRestored = useCallback(() => {
    appendLog("Restored reel edit from browser storage");
  }, [appendLog]);

  useReelEditPersistence({
    assetId,
    file,
    sourceDurationSec,
    reelEdit,
    onRestore: bumpEditorFromStoredEdit,
    onRestoredLog: onPersistedEditRestored,
  });

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

  const editorEnabled = Boolean(file || previewVideoUrl);

  const previewCaptionSegments = useMemo(() => {
    if (
      studioView === "editor" &&
      reelEdit?.captions?.length &&
      reelEdit.trimInSec != null
    ) {
      return sourceCaptionsToClipPreview(
        reelEdit.captions,
        reelEdit.trimInSec,
      );
    }
    return jobResult?.captionSegments ?? null;
  }, [studioView, reelEdit, jobResult?.captionSegments]);

  const handleFileSelect = useCallback(
    async (f: File | null) => {
      setFile(f);
      setAssetId(null);
      setServerPeakTimeSec(null);
      setVideoSourceDurationSec(0);
      setReelEdit(null);
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

  const pipelineBlocked =
    isServerPipeline &&
    Boolean(file || assetId) &&
    studioHealth?.hosting?.pipelineReady === false;

  const pipelineBlockReason = pipelineBlocked
    ? studioHealth?.ffmpeg === false
      ? "ffmpeg is not available on this host — check /api/health."
      : "Durable storage required (configure S3 on ephemeral hosting)."
    : undefined;

  const canRunPipeline =
    Boolean(file || presetId || focus) &&
    !uploading &&
    !pipeline.running &&
    !pipelineBlocked;

  const publishHint = !isServerPipeline
    ? "Mock mode — dispatch logs only."
    : !studioHealth?.integrations?.canPublishAyrshare
      ? studioHealth?.integrations?.ayrshare
        ? "Set APP_BASE_URL to your public HTTPS URL for live Ayrshare posts."
        : "Add AYRSHARE_API_KEY + HTTPS APP_BASE_URL for live posts (stub logs otherwise)."
      : undefined;

  const handleRunPipeline = useCallback(() => {
    if (isServerPipeline) {
      void server.runFullPipeline({
        eqBoost,
        toggles,
        focus,
        sourceLabel: file?.name ?? preset.label,
        presetId,
        crackIntensity,
        roomTone,
        bypassSculpt: exportBypassSculpt,
        crackSampleId,
        edit:
          reelEdit ??
          normalizeReelEdit(defaultReelEdit(sourceDurationSec), sourceDurationSec),
      });
      return;
    }
    runFullPipeline({
      eqBoost,
      toggles,
      focus,
      sourceLabel: file?.name ?? preset.label,
      presetId,
      crackIntensity,
      roomTone,
      bypassSculpt: exportBypassSculpt,
      crackSampleId,
      edit:
        reelEdit ??
        normalizeReelEdit(defaultReelEdit(sourceDurationSec), sourceDurationSec),
    });
  }, [
    eqBoost,
    toggles,
    focus,
    file,
    preset.label,
    presetId,
    crackIntensity,
    roomTone,
    exportBypassSculpt,
    crackSampleId,
    runFullPipeline,
    server,
    reelEdit,
    sourceDurationSec,
  ]);

  const applyAsmrPreset = useCallback((next: AsmrStudioSettings) => {
    setFocus(next.focus);
    setEqBoost(next.eqBoost);
    setCrackIntensity(next.crackIntensity);
    setRoomTone(next.roomTone);
    setPreviewBypass(next.previewBypass);
    setExportBypassSculpt(next.exportBypassSculpt);
    setCrackSampleId(next.crackSampleId);
    setToggles(next.toggles);
    setLiveAsmrPreview(next.liveAsmrPreview);
    appendLog(`ASMR preset loaded · ${next.focus} · crack ${next.crackSampleId}`);
  }, [appendLog]);

  const asmrSettings: AsmrStudioSettings = useMemo(
    () => ({
      focus,
      eqBoost,
      crackIntensity,
      roomTone,
      previewBypass,
      exportBypassSculpt,
      crackSampleId,
      toggles,
      liveAsmrPreview,
    }),
    [
      focus,
      eqBoost,
      crackIntensity,
      roomTone,
      previewBypass,
      exportBypassSculpt,
      crackSampleId,
      toggles,
      liveAsmrPreview,
    ],
  );

  return (
    <div className="relative min-h-screen pb-12">
      {isServerPipeline && <AuthBootstrap />}
      <div
        className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_top,rgba(168,85,247,0.08),transparent_50%),radial-gradient(ellipse_at_bottom_right,rgba(6,182,212,0.06),transparent_45%)]"
        aria-hidden
      />
      <Header />
      <StudioViewTabs
        view={studioView}
        onChange={setStudioView}
        editorEnabled={editorEnabled}
      />
      <StudioCapabilityBanner
        health={studioHealth}
        healthError={healthError}
        mockEditPending={
          !isServerPipeline && hasMeaningfulEdit(reelEdit, sourceDurationSec)
        }
      />
      {isServerPipeline && studioHealth?.hosting?.pipelineReady && (
        <p className="relative mx-auto max-w-7xl px-4 pt-1 text-center text-[10px] uppercase tracking-widest text-emerald-400/90 sm:px-6">
          Server pipeline · SQLite + ffmpeg · SSE logs
        </p>
      )}
      <main className="relative mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6">
        {studioView === "editor" && editorEnabled && (
          <ReelProEditor
            key={`editor-${editorBootKey}-${assetId ?? "local"}-${sourceDurationSec}-${jobResult?.captionSegments?.length ?? 0}`}
            sourceDurationSec={sourceDurationSec}
            peakTimeSec={peakTimeSec}
            captionSegments={jobResult?.captionSegments}
            audioEnvelope={
              sourceAudio.envelope.length ? sourceAudio.envelope : null
            }
            initialEdit={reelEdit}
            onEditChange={setReelEdit}
            onSeekPreview={(t) => setEditorSeekClipSec(t)}
          />
        )}
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
              crackIntensity={crackIntensity}
              onCrackIntensityChange={setCrackIntensity}
              roomTone={roomTone}
              onRoomToneChange={setRoomTone}
              previewBypass={previewBypass}
              onPreviewBypassChange={setPreviewBypass}
              exportBypassSculpt={exportBypassSculpt}
              onExportBypassChange={setExportBypassSculpt}
              livePreview={liveAsmrPreview}
              onLivePreviewChange={setLiveAsmrPreview}
              crackSampleId={crackSampleId}
              onCrackSampleChange={setCrackSampleId}
            />
            <AsmrPresetPanel
              enabled={isServerPipeline}
              settings={asmrSettings}
              onApply={applyAsmrPreset}
            />
            <ApiKeyPanel
              visible={isServerPipeline}
              requireApiKey={studioHealth?.auth?.requireApiKey ?? false}
            />
            <StudioOpsPanels health={studioHealth} />
            <RunPipelineButton
              running={pipeline.running || uploading}
              disabled={!canRunPipeline}
              blockReason={pipelineBlockReason}
              onRun={handleRunPipeline}
            />
            <SocialDispatchPanel
              onDispatch={handleSocialDispatch}
              pipelineComplete={pipelineComplete}
              canPublishLive={
                isServerPipeline &&
                Boolean(studioHealth?.integrations?.canPublishAyrshare)
              }
              publishHint={publishHint}
            />
            {isServerPipeline && (
              <JobHistoryPanel
                activeJobId={server.jobId}
                refreshKey={server.historyTick}
                onOpenJob={(id) =>
                  void server.loadJob(id, (edit) => {
                    if (edit) {
                      bumpEditorFromStoredEdit(edit);
                      if (typeof window !== "undefined") {
                        savePersistedReelEdit(
                          window.localStorage,
                          { assetId, file },
                          edit,
                          sourceDurationSec,
                        );
                      }
                      setStudioView("editor");
                      appendLog("Restored reel edit from job config");
                    }
                  })
                }
              />
            )}
          </div>

          <div className="space-y-4 lg:col-span-7">
            <VerticalReelPlayer
              key={`${previewVideoUrl ?? "sample"}-${preset.id}-${peakTimeSec}-${liveAsmrPreview}-${previewBypass}-${studioView}`}
              preset={preset}
              eqBoost={eqBoost}
              tiktokSubs={toggles.tiktokSubs}
              autoPeakZoom={toggles.autoPeakZoom}
              sfxCrack={toggles.sfxCrack}
              videoUrl={previewVideoUrl}
              peakTimeSec={peakTimeSec}
              captionSegments={previewCaptionSegments}
              audioEnvelope={
                sourceAudio.envelope.length ? sourceAudio.envelope : null
              }
              audioDurationSec={sourceAudio.durationSec}
              focus={focus}
              liveAsmrPreview={
                liveAsmrPreview &&
                Boolean(previewVideoUrl) &&
                !jobResult?.previewUrls?.reel
              }
              previewBypass={previewBypass}
              crackIntensity={crackIntensity}
              crackSampleId={crackSampleId}
              reelEdit={studioView === "editor" ? reelEdit : null}
              previewSeekClipSec={editorSeekClipSec}
              onSourceDurationSec={setVideoSourceDurationSec}
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
            {decodedViaWorker && file && (
              <p className="text-center text-[10px] text-emerald-400/80">
                Waveform decode · shared worker (GPU canvas)
              </p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
