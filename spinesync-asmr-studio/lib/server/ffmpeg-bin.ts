import { access } from "fs/promises";
import { execFile } from "child_process";
import { createRequire } from "module";
import { promisify } from "util";

const execFileAsync = promisify(execFile);
const require = createRequire(import.meta.url);

export function ffmpegExecutable(): string {
  const fromEnv = process.env.FFMPEG_PATH?.trim();
  if (fromEnv) return fromEnv;
  try {
    const bundled = require("ffmpeg-static") as string | null;
    if (typeof bundled === "string" && bundled.length > 0) return bundled;
  } catch {
    /* optional dependency */
  }
  return "ffmpeg";
}

export function ffprobeExecutable(): string {
  const fromEnv = process.env.FFPROBE_PATH?.trim();
  if (fromEnv) return fromEnv;
  try {
    const bundled = require("ffprobe-static") as { path?: string };
    if (bundled?.path) return bundled.path;
  } catch {
    /* optional dependency */
  }
  return "ffprobe";
}

function execErrorMessage(err: unknown): string {
  if (err instanceof Error) {
    const code = "code" in err ? String((err as NodeJS.ErrnoException).code) : "";
    return code ? `${err.message} (${code})` : err.message;
  }
  return "exec failed";
}

export async function checkFfmpegAvailable(): Promise<{
  ok: boolean;
  ffmpegPath: string;
  ffprobePath: string;
  bundled: boolean;
  error?: string;
}> {
  const ffmpegPath = ffmpegExecutable();
  const ffprobePath = ffprobeExecutable();
  const bundled =
    ffmpegPath.includes("node_modules") || ffprobePath.includes("node_modules");

  for (const [label, binPath] of [
    ["ffmpeg", ffmpegPath],
    ["ffprobe", ffprobePath],
  ] as const) {
    try {
      await access(binPath);
    } catch {
      return {
        ok: false,
        ffmpegPath,
        ffprobePath,
        bundled,
        error: `${label} binary missing at ${binPath}`,
      };
    }
  }

  try {
    await execFileAsync(ffmpegPath, ["-version"]);
  } catch (err) {
    return {
      ok: false,
      ffmpegPath,
      ffprobePath,
      bundled,
      error: `ffmpeg: ${execErrorMessage(err)}`,
    };
  }

  try {
    await execFileAsync(ffprobePath, ["-version"]);
  } catch (err) {
    return {
      ok: false,
      ffmpegPath,
      ffprobePath,
      bundled,
      error: `ffprobe: ${execErrorMessage(err)}`,
    };
  }

  return { ok: true, ffmpegPath, ffprobePath, bundled };
}

export function isEphemeralHosting(): boolean {
  if (process.env.VERCEL === "1") return true;
  const root = process.env.SPINESYNC_DATA_ROOT?.trim();
  return root === "/tmp/spinesync" || root?.startsWith("/tmp/") === true;
}

export function pipelineMediaReady(
  storageDriver: "local" | "s3" | "blob",
  durableOk: boolean,
): boolean {
  if (storageDriver !== "local" && durableOk) return true;
  if (isEphemeralHosting() && storageDriver === "local") return false;
  return true;
}
