import type { FocusCategory } from "@/lib/types";
import {
  ASMR_TARGET_LUFS,
  crackMixVolume,
  secondaryCrackDelaySec,
} from "@/lib/asmr-export";
import {
  buildFfmpegEqualizer,
  eqBoostToGainDb,
  getAsmrProfile,
} from "@/lib/asmr-profiles";
import { probeDurationSec, runFfmpeg } from "./ffmpeg";

const LOUDNORM = `loudnorm=I=${ASMR_TARGET_LUFS}:TP=-1.5:LRA=11`;

function multibandFilterChain(focus: FocusCategory, gainDb: number): string {
  const eq = buildFfmpegEqualizer(focus, gainDb);
  return `highpass=f=80,${eq},highshelf=f=10000:width_type=o:width=2:g=2,acompressor`;
}

export async function renderEqAudio(options: {
  sourcePath: string;
  outputPath: string;
  focus: FocusCategory;
  eqBoost: number;
  sfxCrack: boolean;
  crackIntensity: number;
  roomTone: boolean;
  bypassSculpt: boolean;
  peakTimeSec: number;
}) {
  const {
    sourcePath,
    outputPath,
    focus,
    eqBoost,
    sfxCrack,
    crackIntensity,
    roomTone,
    bypassSculpt,
    peakTimeSec,
  } = options;

  if (bypassSculpt) {
    await runFfmpeg([
      "-i",
      sourcePath,
      "-af",
      LOUDNORM,
      outputPath,
    ]);
    return;
  }

  const gainDb = eqBoostToGainDb(eqBoost);
  const profile = getAsmrProfile(focus);
  const mainChain = multibandFilterChain(focus, gainDb);
  const durationSec = (await probeDurationSec(sourcePath)) ?? 60;

  const needsComplex = sfxCrack || roomTone;
  if (!needsComplex) {
    await runFfmpeg([
      "-i",
      sourcePath,
      "-af",
      `${mainChain},${LOUDNORM}`,
      outputPath,
    ]);
    return;
  }

  const delayMs = Math.max(0, Math.round(peakTimeSec * 1000));
  const secDelayMs = Math.max(
    0,
    Math.round(secondaryCrackDelaySec(peakTimeSec) * 1000),
  );
  const crackVol = crackMixVolume(crackIntensity, profile.crackMix);
  const secVol = (crackVol * 0.4).toFixed(2);

  const parts: string[] = [`[0:a]${mainChain}[main]`];
  const mixInputs: string[] = ["[main]"];

  if (roomTone) {
    parts.push(
      `anoisesrc=c=pink:d=${Math.ceil(durationSec + 1)}:sample_rate=48000,volume=0.035[bed]`,
    );
    mixInputs.push("[bed]");
  }

  if (sfxCrack && crackVol > 0.01) {
    parts.push(
      `anoisesrc=d=0.08:c=white:sample_rate=48000,volume=${crackVol},highpass=f=2800,lowpass=f=9500,afade=t=out:st=0.045:d=0.03,adelay=${delayMs}|${delayMs}[crack1]`,
    );
    mixInputs.push("[crack1]");
    if (crackIntensity >= 45) {
      parts.push(
        `anoisesrc=d=0.06:c=white:sample_rate=48000,volume=${secVol},highpass=f=3000,lowpass=f=9000,afade=t=out:st=0.035:d=0.025,adelay=${secDelayMs}|${secDelayMs}[crack2]`,
      );
      mixInputs.push("[crack2]");
    }
  }

  const mixCount = mixInputs.length;
  parts.push(
    `${mixInputs.join("")}amix=inputs=${mixCount}:duration=first:dropout_transition=0,${LOUDNORM}[aout]`,
  );

  await runFfmpeg([
    "-i",
    sourcePath,
    "-filter_complex",
    parts.join(";"),
    "-map",
    "[aout]",
    outputPath,
  ]);
}
