import fs from "fs";
import path from "path";
import { defaultReelEdit } from "@/lib/contract/reel-edit";
import type { PreviewReelBody } from "@/lib/contract/preview-reel";
import { normalizeReelEdit, peakOnTrimmedSource } from "@/lib/reel-edit/normalize";
import { materializeAssetLocalPath } from "./assets";
import { checkFfmpegAvailable } from "./ffmpeg-bin";
import {
  detectPeakTimeSec,
  fileExists,
  probeDurationSec,
} from "./ffmpeg";
import { signedMediaPath } from "./media-token";
import { incrementalPreviewCacheId } from "./preview-cache-key";
import { uploadRoot } from "./paths";
import { renderReel916 } from "./render";
import { materializeTrimmedSource } from "./source-trim";

export type IncrementalPreviewResult = {
  previewUrl: string;
  cacheId: string;
  cached: boolean;
  durationSec: number;
  peakTimeSec: number;
};

function previewDir(cacheId: string) {
  return path.join(uploadRoot(), "previews", cacheId);
}

export async function buildIncrementalReelPreview(
  body: PreviewReelBody,
  asset: {
    storagePath: string | null;
    storageKey?: string | null;
    storageDriver?: string | null;
  },
): Promise<IncrementalPreviewResult> {
  const ffmpegStatus = await checkFfmpegAvailable();
  if (!ffmpegStatus.ok) {
    throw new Error("ffmpeg unavailable — cannot bake incremental preview");
  }

  const cacheId = incrementalPreviewCacheId(body);
  const dir = previewDir(cacheId);
  const reelPath = path.join(dir, "reel.mp4");
  const relativeMedia = `previews/${cacheId}/reel.mp4`;

  if (await fileExists(reelPath)) {
    const durationSec = (await probeDurationSec(reelPath)) ?? 0;
    return {
      previewUrl: signedMediaPath(relativeMedia),
      cacheId,
      cached: true,
      durationSec,
      peakTimeSec: 0,
    };
  }

  await fs.promises.mkdir(dir, { recursive: true });

  if (!asset.storagePath && !asset.storageKey) {
    throw new Error("Asset has no storage location");
  }

  let sourcePath = await materializeAssetLocalPath({
    storagePath: asset.storagePath ?? "",
    storageKey: asset.storageKey,
    storageDriver: asset.storageDriver,
  });

  const rawDuration =
    (await probeDurationSec(sourcePath)) ?? 60;
  const edit = normalizeReelEdit(
    body.edit ?? defaultReelEdit(rawDuration),
    rawDuration,
  );

  const trimmed = await materializeTrimmedSource({
    sourcePath,
    outputPath: path.join(dir, "source-trim.mp4"),
    edit,
    sourceDurationSec: rawDuration,
  });
  if (trimmed.trimmed) sourcePath = trimmed.path;

  const autoPeak = await detectPeakTimeSec(sourcePath, 4.2);
  const peakTimeSec = peakOnTrimmedSource(edit, autoPeak);
  const zoomIntensity = body.zoomIntensity ?? edit.zoomIntensity;

  await renderReel916({
    sourcePath,
    reelPath,
    burnCaptions: false,
    peakTimeSec,
    autoPeakZoom: body.autoPeakZoom,
    zoomIntensity,
    fastPreview: true,
  });

  const durationSec = (await probeDurationSec(reelPath)) ?? 0;

  return {
    previewUrl: signedMediaPath(relativeMedia),
    cacheId,
    cached: false,
    durationSec,
    peakTimeSec,
  };
}
