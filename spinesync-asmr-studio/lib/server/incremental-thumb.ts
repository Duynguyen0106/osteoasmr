import { createHash } from "crypto";
import path from "path";
import { defaultReelEdit } from "@/lib/contract/reel-edit";
import type { PreviewReelBody } from "@/lib/contract/preview-reel";
import { thumbnailSeekOnClip } from "@/lib/reel-edit/thumbnail";
import { normalizeReelEdit } from "@/lib/reel-edit/normalize";
import { detectPeakTimeSec, fileExists, probeDurationSec } from "./ffmpeg";
import { signedMediaPath } from "./media-token";
import { incrementalPreviewCacheId } from "./preview-cache-key";
import { uploadRoot } from "./paths";
import { buildIncrementalReelPreview } from "./incremental-preview";
import { extractBrandedPeakThumbnail } from "./thumbnail-render";

export type IncrementalThumbResult = {
  previewUrl: string;
  cacheId: string;
  cached: boolean;
  seekSec: number;
};

function previewDir(cacheId: string) {
  return path.join(uploadRoot(), "previews", cacheId);
}

/** Stable suffix so headline-only changes re-bake without invalidating reel cache. */
export function incrementalThumbFileName(headline: string): string {
  const key = createHash("sha256")
    .update(headline.trim() || "SPINESYNC ASMR")
    .digest("hex")
    .slice(0, 10);
  return `thumb-${key}.jpg`;
}

/** Branded thumb from cached or freshly baked quick reel in the same preview folder. */
export async function buildIncrementalThumbPreview(
  body: PreviewReelBody,
  asset: {
    storagePath: string | null;
    storageKey?: string | null;
    storageDriver?: string | null;
  },
  headline: string,
): Promise<IncrementalThumbResult> {
  const cacheId = incrementalPreviewCacheId(body);
  const dir = previewDir(cacheId);
  const thumbName = incrementalThumbFileName(headline);
  const thumbPath = path.join(dir, thumbName);
  const reelPath = path.join(dir, "reel.mp4");
  const relativeMedia = `previews/${cacheId}/${thumbName}`;

  const reelResult = await buildIncrementalReelPreview(body, asset);

  let seekSec = 0;
  if (await fileExists(thumbPath)) {
    const edit = normalizeReelEdit(
      body.edit ??
        defaultReelEdit((await probeDurationSec(reelPath)) ?? 60),
      (await probeDurationSec(reelPath)) ?? 60,
    );
    const peakOnClip =
      reelResult.peakTimeSec > 0
        ? reelResult.peakTimeSec
        : await detectPeakTimeSec(reelPath, 4.2);
    seekSec = thumbnailSeekOnClip(edit, peakOnClip);
    return {
      previewUrl: signedMediaPath(relativeMedia),
      cacheId,
      cached: true,
      seekSec,
    };
  }

  if (!(await fileExists(reelPath))) {
    throw new Error("Quick reel preview missing — cannot extract thumbnail");
  }

  const duration = (await probeDurationSec(reelPath)) ?? 60;
  const edit = normalizeReelEdit(
    body.edit ?? defaultReelEdit(duration),
    duration,
  );
  const peakOnClip =
    reelResult.peakTimeSec > 0
      ? reelResult.peakTimeSec
      : await detectPeakTimeSec(reelPath, 4.2);
  seekSec = thumbnailSeekOnClip(edit, peakOnClip);

  await extractBrandedPeakThumbnail({
    inputPath: reelPath,
    outputPath: thumbPath,
    seekSec,
    headline,
  });

  return {
    previewUrl: signedMediaPath(relativeMedia),
    cacheId,
    cached: false,
    seekSec,
  };
}
