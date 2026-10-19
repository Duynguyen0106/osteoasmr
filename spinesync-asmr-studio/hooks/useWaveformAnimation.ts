"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { barHeight } from "@/lib/waveform";

const BAR_COUNT = 48;
const MOCK_DURATION_SEC = 12;

export function useWaveformAnimation(isPlaying: boolean, eqBoost: number) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const startRef = useRef<number>(0);
  const pausedAtRef = useRef(0);
  const [playbackTimeSec, setPlaybackTimeSec] = useState(0);

  const draw = useCallback(
    (timeSec: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const dpr = window.devicePixelRatio || 1;
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
        canvas.width = w * dpr;
        canvas.height = h * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      }

      ctx.clearRect(0, 0, w, h);

      const barW = w / BAR_COUNT;
      const gap = 2;

      for (let i = 0; i < BAR_COUNT; i++) {
        const norm = barHeight(i, BAR_COUNT, timeSec, eqBoost);
        const barH = norm * h * 0.9;
        const x = i * barW + gap / 2;
        const y = h - barH;

        const nearPeak = Math.abs(timeSec - 4.2) <= 0.35;
        ctx.fillStyle = nearPeak ? "#22d3ee" : "#06b6d4";
        if (nearPeak) {
          ctx.shadowColor = "#a855f7";
          ctx.shadowBlur = 12;
        } else {
          ctx.shadowBlur = 0;
        }

        ctx.fillRect(x, y, barW - gap, barH);
      }
      ctx.shadowBlur = 0;
    },
    [eqBoost],
  );

  useEffect(() => {
    if (!isPlaying) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      draw(pausedAtRef.current);
      return;
    }

    startRef.current = performance.now() - pausedAtRef.current * 1000;

    const tick = (now: number) => {
      let t = (now - startRef.current) / 1000;
      if (t >= MOCK_DURATION_SEC) {
        t = 0;
        startRef.current = now;
      }
      pausedAtRef.current = t;
      setPlaybackTimeSec(t);
      draw(t);
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [isPlaying, draw]);

  useEffect(() => {
    draw(pausedAtRef.current);
  }, [eqBoost, draw]);

  return { canvasRef, playbackTimeSec };
}
