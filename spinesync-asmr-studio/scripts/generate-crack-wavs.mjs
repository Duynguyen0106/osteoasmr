#!/usr/bin/env node
/**
 * Generates short crack WAV assets under public/audio/cracks/.
 * Run after changing CRACK_SAMPLES filter params: node scripts/generate-crack-wavs.mjs
 */
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const outDir = path.join(root, "public", "audio", "cracks");

const specs = [
  {
    file: "bright.wav",
    d: 0.08,
    hp: 2800,
    lp: 9500,
    fadeStart: 0.044,
    fadeDur: 0.036,
  },
  {
    file: "warm.wav",
    d: 0.1,
    hp: 1800,
    lp: 7200,
    fadeStart: 0.055,
    fadeDur: 0.045,
  },
  {
    file: "deep.wav",
    d: 0.12,
    hp: 1200,
    lp: 5800,
    fadeStart: 0.066,
    fadeDur: 0.054,
  },
  {
    file: "ribbon.wav",
    d: 0.07,
    hp: 3200,
    lp: 11000,
    fadeStart: 0.038,
    fadeDur: 0.032,
  },
];

fs.mkdirSync(outDir, { recursive: true });

for (const s of specs) {
  const out = path.join(outDir, s.file);
  const af = [
    `highpass=f=${s.hp}`,
    `lowpass=f=${s.lp}`,
    "acompressor=threshold=-18dB:ratio=6:attack=1:release=40",
    `afade=t=out:st=${s.fadeStart}:d=${s.fadeDur}`,
  ].join(",");
  execFileSync(
    "ffmpeg",
    [
      "-y",
      "-hide_banner",
      "-loglevel",
      "error",
      "-f",
      "lavfi",
      "-i",
      `anoisesrc=d=${s.d}:c=white:sample_rate=48000`,
      "-af",
      af,
      out,
    ],
    { stdio: "inherit" },
  );
  console.log("wrote", path.relative(root, out));
}
