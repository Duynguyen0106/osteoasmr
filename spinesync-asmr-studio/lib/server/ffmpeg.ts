import { execFile } from "child_process";
import { promisify } from "util";
import fs from "fs";

const execFileAsync = promisify(execFile);

export async function probeDurationSec(filePath: string): Promise<number | null> {
  try {
    const { stdout } = await execFileAsync("ffprobe", [
      "-v",
      "error",
      "-show_entries",
      "format=duration",
      "-of",
      "default=noprint_wrappers=1:nokey=1",
      filePath,
    ]);
    const value = parseFloat(stdout.trim());
    return Number.isFinite(value) ? value : null;
  } catch {
    return null;
  }
}

export async function detectPeakTimeSec(
  filePath: string,
  fallbackSec = 4.2,
): Promise<number> {
  const duration = (await probeDurationSec(filePath)) ?? fallbackSec;
  const step = Math.max(0.25, Math.min(0.5, duration / 40));
  let bestT = Math.min(fallbackSec, Math.max(0, duration - 0.1));
  let bestScore = -Infinity;

  for (let t = 0; t < duration; t += step) {
    const window = Math.min(step, duration - t);
    try {
      const { stderr } = await execFileAsync(
        "ffmpeg",
        [
          "-hide_banner",
          "-ss",
          String(t),
          "-t",
          String(window),
          "-i",
          filePath,
          "-af",
          "volumedetect",
          "-f",
          "null",
          "-",
        ],
        { maxBuffer: 2 * 1024 * 1024 },
      );
      const match = stderr.match(/max_volume:\s(-?\d+(?:\.\d+)?)\s*dB/);
      if (!match) continue;
      const db = parseFloat(match[1]);
      if (db > bestScore) {
        bestScore = db;
        bestT = t + window / 2;
      }
    } catch {
      continue;
    }
  }

  if (bestScore === -Infinity) {
    return Math.min(fallbackSec, duration * 0.35);
  }
  return Math.round(bestT * 10) / 10;
}

export async function runFfmpeg(args: string[]): Promise<void> {
  await execFileAsync("ffmpeg", ["-hide_banner", "-y", ...args], {
    maxBuffer: 8 * 1024 * 1024,
  });
}

export async function fileExists(p: string): Promise<boolean> {
  try {
    await fs.promises.access(p);
    return true;
  } catch {
    return false;
  }
}
