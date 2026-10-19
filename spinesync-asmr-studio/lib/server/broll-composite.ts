import path from "path";
import { fileExists, runFfmpeg } from "./ffmpeg";

export type BrollCompositeLayer = {
  brollPath: string;
  clipStartSec: number;
  clipEndSec: number;
  brollInSec: number;
};

/** Picture-in-full-frame B-roll cutaways on the trimmed main reel. */
export async function applyBrollOverlays(options: {
  mainPath: string;
  outputPath: string;
  workDir: string;
  layers: BrollCompositeLayer[];
}): Promise<{ composited: boolean; path: string }> {
  const { mainPath, outputPath, workDir, layers } = options;
  if (!layers.length) {
    return { composited: false, path: mainPath };
  }
  if (!(await fileExists(mainPath))) {
    return { composited: false, path: mainPath };
  }

  let currentPath = mainPath;
  for (let i = 0; i < layers.length; i++) {
    const layer = layers[i]!;
    const isLast = i === layers.length - 1;
    const stepOut = isLast
      ? outputPath
      : path.join(workDir, `broll-layer-${i}.mp4`);
    if (!(await fileExists(layer.brollPath))) {
      continue;
    }
    await compositeOne({
      mainPath: currentPath,
      brollPath: layer.brollPath,
      outputPath: stepOut,
      clipStartSec: layer.clipStartSec,
      clipEndSec: layer.clipEndSec,
      brollInSec: layer.brollInSec,
    });
    currentPath = stepOut;
  }

  return { composited: currentPath !== mainPath, path: currentPath };
}

async function compositeOne(options: {
  mainPath: string;
  brollPath: string;
  outputPath: string;
  clipStartSec: number;
  clipEndSec: number;
  brollInSec: number;
}) {
  const {
    mainPath,
    brollPath,
    outputPath,
    clipStartSec,
    clipEndSec,
    brollInSec,
  } = options;
  const duration = Math.max(0.25, clipEndSec - clipStartSec);
  const enable = `between(t,${clipStartSec.toFixed(3)},${clipEndSec.toFixed(3)})`;
  const filter = `[1:v]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,setsar=1,fps=30[broll];[0:v][broll]overlay=enable='${enable}'[outv]`;

  await runFfmpeg([
    "-i",
    mainPath,
    "-ss",
    brollInSec.toFixed(3),
    "-t",
    duration.toFixed(3),
    "-i",
    brollPath,
    "-filter_complex",
    filter,
    "-map",
    "[outv]",
    "-map",
    "0:a?",
    "-c:v",
    "libx264",
    "-preset",
    "veryfast",
    "-crf",
    "23",
    "-c:a",
    "copy",
    outputPath,
  ]);
}
