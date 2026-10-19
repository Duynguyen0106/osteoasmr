"use client";

import { useCallback, useEffect, useRef } from "react";
import { barHeight } from "@/lib/waveform";

const BAR_COUNT = 48;

export function useWaveformCanvas(
  isPlaying: boolean,
  eqBoost: number,
  sfxCrack: boolean,
  getTimeSec: () => number,
) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const getTimeRef = useRef(getTimeSec);

  useEffect(() => {
    getTimeRef.current = getTimeSec;
  }, [getTimeSec]);

  const draw = useCallback(
    (timeSec: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const dpr = window.devicePixelRatio || 1;
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      if (w === 0 || h === 0) return;

      if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
        canvas.width = w * dpr;
        canvas.height = h * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      }

      ctx.clearRect(0, 0, w, h);

      const barW = w / BAR_COUNT;
      const gap = 2;

      for (let i = 0; i < BAR_COUNT; i++) {
        const norm = barHeight(i, BAR_COUNT, timeSec, eqBoost, sfxCrack);
        const barH = norm * h * 0.9;
        const x = i * barW + gap / 2;
        const y = h - barH;

        const nearPeak = Math.abs(timeSec - 4.2) <= 0.35;
        ctx.fillStyle = nearPeak ? "#22d3ee" : "#06b6d4";
        ctx.shadowColor = nearPeak ? "#a855f7" : "transparent";
        ctx.shadowBlur = nearPeak ? 12 : 0;
        ctx.fillRect(x, y, barW - gap, barH);
      }
      ctx.shadowBlur = 0;
    },
    [eqBoost, sfxCrack],
  );

  useEffect(() => {
    draw(getTimeRef.current());
  }, [eqBoost, sfxCrack, draw]);

  useEffect(() => {
    if (!isPlaying) {
      draw(getTimeRef.current());
      return;
    }

    let raf = 0;
    const tick = () => {
      draw(getTimeRef.current());
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [isPlaying, draw]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const observer = new ResizeObserver(() => draw(getTimeRef.current()));
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [draw]);

  return canvasRef;
}
