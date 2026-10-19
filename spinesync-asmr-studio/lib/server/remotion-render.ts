import path from "path";
import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";
import { probeDurationSec } from "./ffmpeg";

const globalForRemotion = globalThis as unknown as {
  remotionBundleUrl?: string;
};

async function getServeUrl() {
  if (!globalForRemotion.remotionBundleUrl) {
    const entry = path.join(process.cwd(), "remotion/index.ts");
    globalForRemotion.remotionBundleUrl = await bundle({
      entryPoint: entry,
    });
  }
  return globalForRemotion.remotionBundleUrl;
}

export async function renderRemotionLocal(options: {
  sourcePath: string;
  outputPath: string;
  peakTimeSec: number;
  practitioner: string;
  cta: string;
}) {
  const serveUrl = await getServeUrl();
  const durationSec = (await probeDurationSec(options.sourcePath)) ?? 12;
  const fps = 30;
  const peakFrame = Math.round(options.peakTimeSec * fps);

  const inputProps = {
    videoSrc: options.sourcePath,
    practitioner: options.practitioner,
    cta: options.cta,
    peakFrame,
    durationSec,
  };

  const composition = await selectComposition({
    serveUrl,
    id: "SpineSyncReel916",
    inputProps,
  });

  composition.durationInFrames = Math.max(
    composition.durationInFrames,
    Math.round(durationSec * fps),
  );

  await renderMedia({
    composition,
    serveUrl,
    codec: "h264",
    outputLocation: options.outputPath,
    inputProps,
  });
}
