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
import {
  ffmpegCrackChain,
  ffmpegCrackFromWavInput,
  getCrackSample,
} from "@/lib/crack-samples";
import {
  crackSampleWavExists,
  resolveCrackWavFsPath,
} from "@/lib/server/crack-asset-path";
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
  crackSampleId: string;
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
    crackSampleId,
    peakTimeSec,
  } = options;

  const crackSample = getCrackSample(crackSampleId);

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
  const extraInputs: string[] = [];

  const addCrackLayer = (
    sample: ReturnType<typeof getCrackSample>,
    volume: number,
    delay: number,
    label: string,
  ) => {
    if (crackSampleWavExists(sample)) {
      const fsPath = resolveCrackWavFsPath(sample.wavPath!);
      let slot = extraInputs.indexOf(fsPath);
      if (slot === -1) {
        extraInputs.push(fsPath);
        slot = extraInputs.length - 1;
      }
      const inputIndex = slot + 1;
      parts.push(
        ffmpegCrackFromWavInput(inputIndex, volume, delay, label),
      );
    } else {
      parts.push(ffmpegCrackChain(sample, volume, delay, label));
    }
    mixInputs.push(`[${label}]`);
  };

  if (roomTone) {
    parts.push(
      `anoisesrc=c=pink:d=${Math.ceil(durationSec + 1)}:sample_rate=48000,volume=0.035[bed]`,
    );
    mixInputs.push("[bed]");
  }

  if (sfxCrack && crackVol > 0.01) {
    addCrackLayer(crackSample, crackVol, delayMs, "crack1");
    if (crackIntensity >= 45) {
      const tail = getCrackSample("syn-ribbon");
      addCrackLayer(tail, Number(secVol), secDelayMs, "crack2");
    }
  }

  const mixCount = mixInputs.length;
  parts.push(
    `${mixInputs.join("")}amix=inputs=${mixCount}:duration=first:dropout_transition=0,${LOUDNORM}[aout]`,
  );

  const ffmpegArgs = ["-i", sourcePath];
  for (const p of extraInputs) {
    ffmpegArgs.push("-i", p);
  }
  ffmpegArgs.push(
    "-filter_complex",
    parts.join(";"),
    "-map",
    "[aout]",
    outputPath,
  );

  await runFfmpeg(ffmpegArgs);
}
