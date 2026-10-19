"use client";

import { useWaveformCanvas } from "@/hooks/useWaveformAnimation";

interface WaveformCanvasProps {
  isPlaying: boolean;
  eqBoost: number;
  sfxCrack: boolean;
  getTimeSec: () => number;
  peakTimeSec: number;
  audioEnvelope?: number[] | null;
  audioDurationSec?: number;
}

export function WaveformCanvas({
  isPlaying,
  eqBoost,
  sfxCrack,
  getTimeSec,
  peakTimeSec,
  audioEnvelope = null,
  audioDurationSec = 0,
}: WaveformCanvasProps) {
  const canvasRef = useWaveformCanvas(
    isPlaying,
    eqBoost,
    sfxCrack,
    getTimeSec,
    peakTimeSec,
    audioEnvelope,
    audioDurationSec,
  );

  return (
    <canvas
      ref={canvasRef}
      className="absolute bottom-0 left-0 right-0 z-10 h-[22%] w-full opacity-90"
      aria-hidden
    />
  );
}
