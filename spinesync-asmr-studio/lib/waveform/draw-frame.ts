import { barHeight } from "@/lib/waveform";

const BAR_COUNT = 48;

export function drawWaveformFrame(
  ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
  width: number,
  height: number,
  options: {
    timeSec: number;
    eqBoost: number;
    sfxCrack: boolean;
    peakTimeSec: number;
    audioEnvelope: number[] | null;
    audioDurationSec: number;
  },
) {
  const w = width;
  const h = height;
  if (w === 0 || h === 0) return;

  ctx.clearRect(0, 0, w, h);

  const barW = w / BAR_COUNT;
  const gap = 2;
  const {
    timeSec,
    eqBoost,
    sfxCrack,
    peakTimeSec,
    audioEnvelope,
    audioDurationSec,
  } = options;

  for (let i = 0; i < BAR_COUNT; i += 1) {
    const norm = barHeight(
      i,
      BAR_COUNT,
      timeSec,
      eqBoost,
      sfxCrack,
      peakTimeSec,
      audioEnvelope,
      audioDurationSec,
    );
    const barH = norm * h * 0.9;
    const x = i * barW + gap / 2;
    const y = h - barH;

    const nearPeak = Math.abs(timeSec - peakTimeSec) <= 0.35;
    ctx.fillStyle = nearPeak ? "#22d3ee" : "#06b6d4";
    ctx.shadowColor = nearPeak ? "#a855f7" : "transparent";
    ctx.shadowBlur = nearPeak ? 12 : 0;
    ctx.fillRect(x, y, barW - gap, barH);
  }
  ctx.shadowBlur = 0;
}

export const WAVEFORM_BAR_COUNT = BAR_COUNT;
