import path from "path";
import { fileExists, runFfmpeg } from "./ffmpeg";

export async function renderReel916(options: {
  sourcePath?: string;
  reelPath: string;
  audioEqPath?: string;
  vttPath?: string;
  burnCaptions: boolean;
  peakTimeSec: number;
  autoPeakZoom: boolean;
  zoomIntensity?: number;
  /** Faster encode for editor incremental preview (no EQ pass). */
  fastPreview?: boolean;
}) {
  const {
    sourcePath,
    reelPath,
    audioEqPath,
    vttPath,
    burnCaptions,
    peakTimeSec,
    autoPeakZoom,
    zoomIntensity = 100,
    fastPreview = false,
  } = options;
  const zoomScale = 1 + (Math.max(0, Math.min(100, zoomIntensity)) / 100) * 0.12;

  if (sourcePath && (await fileExists(sourcePath))) {
    let vf =
      "scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920";
    if (burnCaptions && vttPath && (await fileExists(vttPath))) {
      const escaped = vttPath.replace(/\\/g, "/").replace(/:/g, "\\:");
      vf += `,subtitles=${escaped}:force_style='FontName=Arial Bold,FontSize=28,PrimaryColour=&H00FFFF&,OutlineColour=&H000000&,BorderStyle=3'`;
    }
    if (autoPeakZoom) {
      const p = Math.max(0, peakTimeSec - 0.2);
      const p2 = peakTimeSec + 0.35;
      vf += `,zoompan=z='if(between(t,${p},${p2}),${zoomScale.toFixed(3)},1)':d=1:x=iw/2-(iw/zoom/2):y=ih/2-(ih/zoom/2):s=1080x1920:fps=30`;
    }

    const args = ["-i", sourcePath];
    if (audioEqPath && (await fileExists(audioEqPath))) {
      args.push("-i", audioEqPath, "-map", "0:v", "-map", "1:a");
    } else {
      args.push("-map", "0:v", "-map", "0:a?");
    }
    args.push(
      "-vf",
      vf,
      "-c:v",
      "libx264",
      "-preset",
      fastPreview ? "ultrafast" : "veryfast",
      "-crf",
      fastPreview ? "28" : "23",
      "-c:a",
      "aac",
      "-b:a",
      fastPreview ? "128k" : "192k",
      "-shortest",
      reelPath,
    );
    await runFfmpeg(args);
    return;
  }

  await runFfmpeg([
    "-f",
    "lavfi",
    "-i",
    "color=c=0x090d16:s=1080x1920:d=8",
    "-c:v",
    "libx264",
    "-t",
    "8",
    reelPath,
  ]);
}

export function jobArtifactPath(jobId: string, name: string) {
  return path.join(process.cwd(), ".data", "uploads", "jobs", jobId, name);
}
