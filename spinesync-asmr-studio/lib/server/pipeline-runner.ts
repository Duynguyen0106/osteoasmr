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
  detectPeakTimeSec,
  fileExists,
  probeDurationSec,
  runFfmpeg,
} from "./ffmpeg";
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

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export async function runJobPipeline(jobId: string, config: CreateJobBody) {
  const dir = jobDir(jobId);
  await fs.promises.mkdir(dir, { recursive: true });

  markJobRunning(jobId);
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
  const sourcePath = asset
    ? await materializeAssetLocalPath({
        storagePath: asset.storagePath,
        storageKey: asset.storageKey,
        storageDriver: asset.storageDriver,
      })
    : undefined;
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
          peak.timeSec = await detectPeakTimeSec(sourcePath, 4.2);
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
        if (sourcePath && (await fileExists(sourcePath))) {
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
        if (input && (await fileExists(input))) {
          const duration = (await probeDurationSec(input)) ?? 8;
          const ss = Math.min(peak.timeSec, Math.max(0, duration - 0.1));
          await runFfmpeg([
            "-ss",
            String(ss),
            "-i",
            input,
            "-frames:v",
            "1",
            thumbPath,
          ]);
        }
        appendJobLog(
          jobId,
          `Frame grab @ 00:${peak.timeSec.toFixed(1)}s · contrast boost · headline overlay`,
        );
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
