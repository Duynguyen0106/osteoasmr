"use client";

import { useWaveformAnimation } from "@/hooks/useWaveformAnimation";

interface WaveformCanvasProps {
  isPlaying: boolean;
  eqBoost: number;
}

export function WaveformCanvas({ isPlaying, eqBoost }: WaveformCanvasProps) {
  const { canvasRef } = useWaveformAnimation(isPlaying, eqBoost);

  return (
    <canvas
      ref={canvasRef}
      className="absolute bottom-0 left-0 right-0 h-[22%] w-full opacity-90"
      aria-hidden
    />
  );
}
