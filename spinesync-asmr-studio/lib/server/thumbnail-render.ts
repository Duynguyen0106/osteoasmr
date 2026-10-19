import { fileExists, probeDurationSec, runFfmpeg } from "./ffmpeg";

const OUT_W = 1080;
const OUT_H = 1920;

/** Clamp seek time for a single-frame extract. */
export function clampThumbnailSeekSec(
  durationSec: number,
  peakSec: number,
): number {
  const dur = Math.max(durationSec, 0.1);
  return Math.min(Math.max(0, peakSec), Math.max(0, dur - 0.05));
}

/** Escape user/preset text for ffmpeg drawtext. */
export function escapeDrawtext(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/:/g, "\\:")
    .replace(/'/g, "\u2019")
    .replace(/%/g, "\\%")
    .slice(0, 80);
}

export async function extractBrandedPeakThumbnail(options: {
  inputPath: string;
  outputPath: string;
  seekSec: number;
  headline: string;
}): Promise<void> {
  const { inputPath, outputPath, seekSec, headline } = options;
  if (!(await fileExists(inputPath))) {
    throw new Error("Thumbnail input video not found");
  }

  const duration = (await probeDurationSec(inputPath)) ?? 8;
  const ss = clampThumbnailSeekSec(duration, seekSec);
  const safeText = escapeDrawtext(headline.trim() || "SPINESYNC");

  const vf = [
    `scale=${OUT_W}:${OUT_H}:force_original_aspect_ratio=increase`,
    `crop=${OUT_W}:${OUT_H}`,
    "eq=contrast=1.1:brightness=0.03:saturation=1.05",
    `drawtext=text='${safeText}':fontsize=56:fontcolor=yellow:borderw=4:bordercolor=black@0.9:x=(w-text_w)/2:y=h*0.42:box=1:boxcolor=black@0.55:boxborderw=12`,
  ].join(",");

  await runFfmpeg([
    "-ss",
    ss.toFixed(3),
    "-i",
    inputPath,
    "-frames:v",
    "1",
    "-vf",
    vf,
    "-q:v",
    "2",
    outputPath,
  ]);
}
