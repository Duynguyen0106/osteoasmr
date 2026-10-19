import type { FocusCategory } from "@/lib/types";
import {
  buildFfmpegEqualizer,
  eqBoostToGainDb,
  getAsmrProfile,
} from "@/lib/asmr-profiles";
import { runFfmpeg } from "./ffmpeg";

export async function renderEqAudio(options: {
  sourcePath: string;
  outputPath: string;
  focus: FocusCategory;
  eqBoost: number;
  sfxCrack: boolean;
  peakTimeSec: number;
}) {
  const { sourcePath, outputPath, focus, eqBoost, sfxCrack, peakTimeSec } =
    options;
  const gainDb = eqBoostToGainDb(eqBoost);
  const eq = buildFfmpegEqualizer(focus, gainDb);
  const profile = getAsmrProfile(focus);

  if (!sfxCrack) {
    await runFfmpeg([
      "-i",
      sourcePath,
      "-af",
      `${eq},acompressor`,
      outputPath,
    ]);
    return;
  }

  const delayMs = Math.max(0, Math.round(peakTimeSec * 1000));
  const crackVol = (0.45 + profile.crackMix * 0.35).toFixed(2);
  const filterComplex = [
    `[0:a]${eq},acompressor[main]`,
    `anoisesrc=d=0.08:c=white:sample_rate=48000,volume=${crackVol},highpass=f=2800,lowpass=f=9500,afade=t=out:st=0.045:d=0.03,adelay=${delayMs}|${delayMs}[crack]`,
    `[main][crack]amix=inputs=2:duration=first:dropout_transition=0[aout]`,
  ].join(";");

  await runFfmpeg([
    "-i",
    sourcePath,
    "-filter_complex",
    filterComplex,
    "-map",
    "[aout]",
    outputPath,
  ]);
}
