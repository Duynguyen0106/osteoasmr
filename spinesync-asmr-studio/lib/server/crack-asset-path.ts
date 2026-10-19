import fs from "node:fs";
import path from "node:path";
import type { CrackSampleDef } from "@/lib/crack-samples";

/** Public URL path (e.g. /audio/cracks/bright.wav) → absolute filesystem path. */
export function resolveCrackWavFsPath(wavPath: string): string {
  const relative = wavPath.replace(/^\//, "");
  return path.join(process.cwd(), "public", relative);
}

export function crackSampleWavExists(sample: CrackSampleDef): boolean {
  if (!sample.wavPath) return false;
  try {
    return fs.existsSync(resolveCrackWavFsPath(sample.wavPath));
  } catch {
    return false;
  }
}
