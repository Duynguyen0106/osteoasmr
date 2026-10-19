import path from "path";
import { clipDurationSec } from "@/lib/reel-edit/normalize";
import type { ReelEditState } from "@/lib/contract/reel-edit";
import { fileExists, runFfmpeg } from "./ffmpeg";

/** Fast trim copy when edit window is smaller than full source */
export async function materializeTrimmedSource(options: {
  sourcePath: string;
  outputPath: string;
  edit: ReelEditState;
}): Promise<{ path: string; trimmed: boolean }> {
  const { sourcePath, outputPath, edit } = options;
  const clipDur = clipDurationSec(edit);
  const needsTrim = edit.trimInSec > 0.01 || edit.trimOutSec != null;

  if (!needsTrim) {
    return { path: sourcePath, trimmed: false };
  }

  await runFfmpeg([
    "-ss",
    String(edit.trimInSec),
    "-i",
    sourcePath,
    "-t",
    String(clipDur),
    "-c",
    "copy",
    "-avoid_negative_ts",
    "make_zero",
    outputPath,
  ]);

  if (!(await fileExists(outputPath))) {
    await runFfmpeg([
      "-ss",
      String(edit.trimInSec),
      "-i",
      sourcePath,
      "-t",
      String(clipDur),
      "-c:v",
      "libx264",
      "-preset",
      "veryfast",
      "-c:a",
      "aac",
      outputPath,
    ]);
  }

  return { path: outputPath, trimmed: true };
}

export function trimmedSourcePath(jobDir: string): string {
  return path.join(jobDir, "source-trim.mp4");
}
