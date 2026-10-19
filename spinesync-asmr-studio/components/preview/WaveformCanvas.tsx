"use client";

import { useWaveformCanvas } from "@/hooks/useWaveformAnimation";

interface WaveformCanvasProps {
  playbackTimeSec: number;
  eqBoost: number;
  sfxCrack: boolean;
}

export function WaveformCanvas({
  playbackTimeSec,
  eqBoost,
  sfxCrack,
}: WaveformCanvasProps) {
  const canvasRef = useWaveformCanvas(playbackTimeSec, eqBoost, sfxCrack);

  return (
    <canvas
      ref={canvasRef}
      className="absolute bottom-0 left-0 right-0 z-10 h-[22%] w-full opacity-90"
      aria-hidden
    />
  );
}
