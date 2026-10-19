import fs from "fs";
import path from "path";
import type { CreateJobBody, JobCopyResult, JobResult, PeakResult } from "@/lib/contract/job";
import { PIPELINE_STAGES, STAGE_DURATION_MS } from "@/lib/pipeline";
import type { PipelineStageId } from "@/lib/types";
import type { CaptionSegment } from "./captions";
import { fallbackCaptionSegments } from "./captions";
import { presetHeadline, presetPeakDefaults } from "./copy";
import { ASMR_TARGET_LUFS } from "@/lib/asmr-export";
import { getAsmrProfile, eqBoostToGainDb } from "@/lib/asmr-profiles";
import { renderEqAudio } from "./audio-eq";
import {
  checkFfmpegAvailable,
  pipelineMediaReady,
} from "./ffmpeg-bin";
import {
  detectPeakTimeSec,
  fileExists,
  probeDurationSec,
  runFfmpeg,
} from "./ffmpeg";
import { hasS3Config, storageDriverEnv } from "./config";
import { materializeAssetLocalPath } from "./assets";
import {
  appendJobLog,
  completeJob,
  failJob,
  getAssetById,
  markJobRunning,
  updateJobStage,
} from "./job-service";
import { generateGptCopy, headlineForConfig, prepareWhisperAudio, transcribeWhisper } from "./openai";
import { hasOpenAI, remotionRenderMode, remotionRenderRequested } from "./config";
import { jobDir } from "./paths";
import { buildJobPreviewUrls, publishJobArtifactsToStorage } from "./job-artifacts";
import { renderReel916 } from "./render";
import { renderRemotionLocal } from "./remotion-render";
import { defaultReelEdit } from "@/lib/contract/reel-edit";
import { captionsForTrimmedExport } from "@/lib/reel-edit/captions";
import { normalizeReelEdit } from "@/lib/reel-edit/normalize";
import {
  materializeTrimmedSource,
  trimmedSourcePath,
} from "./source-trim";
import { brollForTrimmedExport } from "@/lib/reel-edit/broll";
import { applyBrollOverlays } from "./broll-composite";
import { segmentsToVtt } from "./captions";
import { thumbnailSeekOnClip } from "@/lib/reel-edit/thumbnail";
import { extractBrandedPeakThumbnail } from "./thumbnail-render";

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export async function runJobPipeline(jobId: string, config: CreateJobBody) {
  const dir = jobDir(jobId);
  await fs.promises.mkdir(dir, { recursive: true });

  markJobRunning(jobId);

  const ffmpegStatus = await checkFfmpegAvailable();
  const storageDriver = storageDriverEnv();
  const durable = pipelineMediaReady(storageDriver, hasS3Config());
  if (config.assetId && (!ffmpegStatus.ok || !durable)) {
    const reasons: string[] = [];
    if (!ffmpegStatus.ok) {
      reasons.push("ffmpeg unavailable (install ffmpeg or use bundled static binary on deploy)");
    }
    if (!durable) {
      reasons.push(
        "local disk is ephemeral on this host — set STORAGE_DRIVER=s3 for durable job artifacts",
      );
    }
    failJob(jobId, `Pipeline preflight failed: ${reasons.join("; ")}`);
    appendJobLog(jobId, `✗ ${reasons.join(" · ")}`);
    return;
  }

  appendJobLog(jobId, "▶ RUN FULL AI PIPELINE initiated");
  appendJobLog(
    jobId,
    `Source: ${config.sourceLabel} · focus=${config.focus} · EQ +${config.eqBoost}% · peak zoom=${config.toggles.autoPeakZoom ? "ON" : "OFF"} · SFX crack=${config.toggles.sfxCrack ? "ON" : "OFF"} · TikTok subs=${config.toggles.tiktokSubs ? "ON" : "OFF"}`,
  );
  appendJobLog(
    jobId,
    `Integrations · OpenAI=${hasOpenAI() ? "ON" : "OFF (template/fallback)"}`,
  );

  const asset = config.assetId ? getAssetById(config.assetId) : undefined;
  let sourcePath = asset
    ? await materializeAssetLocalPath({
        storagePath: asset.storagePath,
        storageKey: asset.storageKey,
        storageDriver: asset.storageDriver,
      })
    : undefined;

  const rawDuration =
    sourcePath && (await fileExists(sourcePath))
      ? (await probeDurationSec(sourcePath)) ?? 60
      : 60;
  const edit = normalizeReelEdit(
    config.edit ?? defaultReelEdit(rawDuration),
    rawDuration,
  );
  if (sourcePath && (await fileExists(sourcePath))) {
    const trimOut = edit.trimOutSec ?? rawDuration;
    if (edit.trimInSec > 0.01 || trimOut < rawDuration - 0.05) {
      appendJobLog(
        jobId,
        `Reel edit · trim ${edit.trimInSec.toFixed(2)}s → ${trimOut.toFixed(2)}s (${(trimOut - edit.trimInSec).toFixed(2)}s clip)`,
      );
      const trimmed = await materializeTrimmedSource({
        sourcePath,
        outputPath: trimmedSourcePath(dir),
        edit,
        sourceDurationSec: rawDuration,
      });
      if (trimmed.trimmed) sourcePath = trimmed.path;
    }
    if (edit.peakTimeSec != null) {
      appendJobLog(
        jobId,
        `Reel edit · manual peak @ ${edit.peakTimeSec.toFixed(2)}s on timeline`,
      );
    }
    if (edit.markers.length > 0) {
      appendJobLog(
        jobId,
        `Reel edit · ${edit.markers.length} timeline marker(s) (reference only)`,
      );
    }
    const brollLayers = brollForTrimmedExport(edit.brollOverlays, edit);
    if (brollLayers.length > 0) {
      appendJobLog(
        jobId,
        `Reel edit · ${brollLayers.length} B-roll overlay(s) on clip timeline`,
      );
      const resolved: {
        brollPath: string;
        clipStartSec: number;
        clipEndSec: number;
        brollInSec: number;
      }[] = [];
      for (const layer of brollLayers) {
        const brollAsset = getAssetById(layer.assetId);
        if (!brollAsset) {
          appendJobLog(
            jobId,
            `B-roll skipped · asset ${layer.assetId.slice(0, 8)}… not found`,
          );
          continue;
        }
        const brollPath = await materializeAssetLocalPath({
          storagePath: brollAsset.storagePath,
          storageKey: brollAsset.storageKey,
          storageDriver: brollAsset.storageDriver,
        });
        if (brollPath && (await fileExists(brollPath))) {
          resolved.push({
            brollPath,
            clipStartSec: layer.clipStartSec,
            clipEndSec: layer.clipEndSec,
            brollInSec: layer.brollInSec,
          });
        }
      }
      if (resolved.length > 0) {
        const compositePath = path.join(dir, "source-broll-composite.mp4");
        const composite = await applyBrollOverlays({
          mainPath: sourcePath,
          outputPath: compositePath,
          workDir: dir,
          layers: resolved,
        });
        if (composite.composited) {
          sourcePath = composite.path;
          appendJobLog(jobId, "B-roll compositor · overlays baked into source");
        }
      }
    }
  }
  const defaults = presetPeakDefaults(config.presetId, config.focus);
  const gainDb = eqBoostToGainDb(config.eqBoost);
  const asmrProfileMeta = getAsmrProfile(config.focus);
  const eqAudioPath = path.join(dir, "audio-eq.wav");
  const vttPath = path.join(dir, "captions.vtt");
  const segmentsPath = path.join(dir, "segments.json");
  const reelPath = path.join(dir, "reel.mp4");
  const thumbPath = path.join(dir, "thumb.jpg");
  const copyPath = path.join(dir, "copy.json");

  const peak: PeakResult = {
    timeSec: 4.2,
    peakDb: defaults.peakDb,
    freqGainDb: defaults.freqGainDb + gainDb * 0.4,
    freqKhz: defaults.freqKhz,
  };

  let captionSegments: CaptionSegment[] = fallbackCaptionSegments();
  let jobCopy: JobCopyResult | null = null;
  let copyRevision = 0;

  const total = PIPELINE_STAGES.length;

  try {
    for (let i = 0; i < total; i++) {
      const stage = PIPELINE_STAGES[i];
      const stageId = stage.id as PipelineStageId;
      const progress = Math.round((i / total) * 100);

      updateJobStage(jobId, stageId, "running", progress);
      appendJobLog(jobId, `[${stage.label}] processing...`);

      if (stageId === "eq") {
        if (sourcePath && (await fileExists(sourcePath))) {
          const autoPeak = await detectPeakTimeSec(sourcePath, 4.2);
          peak.timeSec = edit.peakTimeSec ?? autoPeak;
          peak.peakDb = -1.2;
          peak.freqGainDb = defaults.freqGainDb + gainDb * 0.4;

          await renderEqAudio({
            sourcePath,
            outputPath: eqAudioPath,
            focus: config.focus,
            eqBoost: config.eqBoost,
            sfxCrack: config.toggles.sfxCrack,
            crackIntensity: config.crackIntensity ?? 65,
            roomTone: config.roomTone ?? false,
            bypassSculpt: config.bypassSculpt ?? false,
            crackSampleId: config.crackSampleId ?? "syn-bright",
            peakTimeSec: peak.timeSec,
          });
        }
        await fs.promises.writeFile(
          path.join(dir, "peak.json"),
          JSON.stringify(peak, null, 2),
        );
        appendJobLog(
          jobId,
          `Peaks locked @ ${peak.timeSec}s · ${asmrProfileMeta.label} · EQ +${gainDb} dB @ ${asmrProfileMeta.centerHz} Hz${config.toggles.sfxCrack ? " · crack layer @ peak" : ""}`,
        );
      } else if (stageId === "whisper") {
        const whisperAudio = path.join(dir, "whisper.mp3");
        const exportCaptions = captionsForTrimmedExport(edit.captions, edit);
        if (exportCaptions?.length) {
          captionSegments = exportCaptions;
          const vtt = segmentsToVtt(captionSegments);
          await fs.promises.writeFile(vttPath, vtt);
          await fs.promises.writeFile(
            segmentsPath,
            JSON.stringify(captionSegments, null, 2),
          );
          appendJobLog(
            jobId,
            `Reel editor · ${captionSegments.length} caption segments (Whisper skipped)`,
          );
        } else if (sourcePath && (await fileExists(sourcePath))) {
          await prepareWhisperAudio(sourcePath, whisperAudio, eqAudioPath);
          const { segments, vtt, provider } = await transcribeWhisper(whisperAudio);
          captionSegments = segments;
          await fs.promises.writeFile(vttPath, vtt);
          await fs.promises.writeFile(segmentsPath, JSON.stringify(segments, null, 2));
          appendJobLog(
            jobId,
            `Whisper · ${provider} · ${segments.length} segments · karaoke timing synced`,
          );
        } else {
          await fs.promises.writeFile(vttPath, "WEBVTT\n\n");
          await fs.promises.writeFile(
            segmentsPath,
            JSON.stringify(captionSegments, null, 2),
          );
          appendJobLog(jobId, stage.logMessage);
        }
      } else if (stageId === "remotion") {
        const remotionRequested = remotionRenderRequested();
        const remotionMode = remotionRenderMode();
        if (remotionRequested === "lambda") {
          appendJobLog(
            jobId,
            "Remotion Lambda is not deployed in this repo — using ffmpeg 9:16 render",
          );
        }
        let rendered = false;
        if (remotionMode === "local" && sourcePath) {
          try {
            await renderRemotionLocal({
              sourcePath,
              outputPath: reelPath,
              peakTimeSec: peak.timeSec,
              practitioner: "Dr. Smith | SpineSync",
              cta: "SpineSync Clinic | Book Link in Bio",
            });
            rendered = true;
            appendJobLog(jobId, "Remotion local · SpineSyncReel916 · 1080×1920");
          } catch (err) {
            appendJobLog(
              jobId,
              `Remotion local skipped · ${err instanceof Error ? err.message : "error"}`,
            );
          }
        }
        if (!rendered) {
          try {
            await renderReel916({
              sourcePath,
              reelPath,
              audioEqPath: eqAudioPath,
              vttPath,
              burnCaptions: config.toggles.tiktokSubs,
              peakTimeSec: peak.timeSec,
              autoPeakZoom: config.toggles.autoPeakZoom,
              zoomIntensity: edit.zoomIntensity,
            });
            appendJobLog(
              jobId,
              `9:16 video render (ffmpeg) · 1080×1920 · ${config.toggles.tiktokSubs ? "burned captions · " : ""}${config.toggles.autoPeakZoom ? "micro-zoom @ peak" : "standard crop"}`,
            );
          } catch {
            await renderReel916({
              sourcePath,
              reelPath,
              audioEqPath: eqAudioPath,
              vttPath,
              burnCaptions: false,
              peakTimeSec: peak.timeSec,
              autoPeakZoom: false,
            });
            appendJobLog(jobId, "9:16 video render · fallback (simplified ffmpeg chain)");
          }
        }
      } else if (stageId === "thumbnail") {
        const input = (await fileExists(reelPath)) ? reelPath : sourcePath;
        const headline =
          jobCopy?.headline?.trim() || headlineForConfig(config);
        if (input && (await fileExists(input))) {
          const thumbSeekSec = thumbnailSeekOnClip(edit, peak.timeSec);
          try {
            await extractBrandedPeakThumbnail({
              inputPath: input,
              outputPath: thumbPath,
              seekSec: thumbSeekSec,
              headline,
            });
            appendJobLog(
              jobId,
              `Branded 9:16 thumb @ 00:${thumbSeekSec.toFixed(1)}s on clip · ${jobCopy ? "GPT headline" : "preset headline"} · "${headline.slice(0, 40)}${headline.length > 40 ? "…" : ""}"`,
            );
          } catch (err) {
            const duration = (await probeDurationSec(input)) ?? 8;
            const ss = Math.min(
              thumbSeekSec,
              Math.max(0, duration - 0.1),
            );
            await runFfmpeg([
              "-ss",
              String(ss),
              "-i",
              input,
              "-frames:v",
              "1",
              thumbPath,
            ]);
            appendJobLog(
              jobId,
              `Thumbnail fallback (raw frame) · ${err instanceof Error ? err.message : "branded render failed"}`,
            );
          }
        } else {
          appendJobLog(jobId, "Thumbnail skipped · no reel/source video on disk");
        }
      } else if (stageId === "gpt") {
        copyRevision += 1;
        const excerpt = captionSegments.map((s) => s.text).join(" ").slice(0, 280);
        const { copy, provider } = await generateGptCopy(config, copyRevision, {
          headline: headlineForConfig(config),
          peakTimeSec: peak.timeSec,
          captionExcerpt: excerpt,
        });
        jobCopy = copy;
        await fs.promises.writeFile(copyPath, JSON.stringify(copy, null, 2));
        appendJobLog(
          jobId,
          `GPT-4o (${provider}) · IG/TikTok/Shorts variants · copywriter UI refreshed`,
        );
      } else if (stageId === "dispatch") {
        await fs.promises.writeFile(
          path.join(dir, "publish.json"),
          JSON.stringify({ status: "armed", platforms: 4 }, null, 2),
        );
        appendJobLog(jobId, stage.logMessage);
      }

      updateJobStage(
        jobId,
        stageId,
        "done",
        Math.round(((i + 1) / total) * 100),
      );
      await delay(Math.min(STAGE_DURATION_MS, 400));
    }

    if (!jobCopy) {
      copyRevision = 1;
      const { copy } = await generateGptCopy(config, copyRevision, {
        headline: presetHeadline(config.presetId, config.focus),
        peakTimeSec: peak.timeSec,
        captionExcerpt: "",
      });
      jobCopy = copy;
      await fs.promises.writeFile(copyPath, JSON.stringify(copy, null, 2));
    }

    await publishJobArtifactsToStorage(jobId, dir);

    const result: JobResult = {
      peak,
      asmrProfile: {
        focus: config.focus,
        label: asmrProfileMeta.label,
        centerHz: asmrProfileMeta.centerHz,
        gainDb,
        eqBoost: config.eqBoost,
        sfxCrack: config.toggles.sfxCrack,
        crackIntensity: config.crackIntensity ?? 65,
        roomTone: config.roomTone ?? false,
        bypassSculpt: config.bypassSculpt ?? false,
        crackSampleId: config.crackSampleId ?? "syn-bright",
        targetLufs: ASMR_TARGET_LUFS,
      },
      copy: jobCopy,
      captionSegments,
      artifacts: {
        reel: reelPath,
        thumb: thumbPath,
        captions: vttPath,
        copy: copyPath,
      },
      previewUrls: await buildJobPreviewUrls(jobId),
    };

    completeJob(jobId, result, copyRevision);
    appendJobLog(jobId, "✓ Pipeline complete — assets ready for dispatch");
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown pipeline error";
    failJob(jobId, message);
  }
}

export function enqueueJob(jobId: string, config: CreateJobBody) {
  void runJobPipeline(jobId, config);
}
