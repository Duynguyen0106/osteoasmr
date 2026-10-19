"use client";

import { useCallback, useEffect, useRef } from "react";
import { drawWaveformFrame } from "@/lib/waveform/draw-frame";
import {
  attachWaveformOffscreen,
  postWaveformEnvelope,
  postWaveformFrame,
} from "@/lib/waveform/shared-worker-client";

export function useWaveformCanvas(
  isPlaying: boolean,
  eqBoost: number,
  sfxCrack: boolean,
  getTimeSec: () => number,
  peakTimeSec: number,
  audioEnvelope: number[] | null,
  audioDurationSec: number,
) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const getTimeRef = useRef(getTimeSec);
  const workerPortRef = useRef<MessagePort | null>(null);
  const workerActiveRef = useRef(false);

  useEffect(() => {
    getTimeRef.current = getTimeSec;
  }, [getTimeSec]);

  const drawMainThread = useCallback(
    (timeSec: number) => {
      const canvas = canvasRef.current;
      if (!canvas || workerActiveRef.current) return;
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

      drawWaveformFrame(ctx, w, h, {
        timeSec,
        eqBoost,
        sfxCrack,
        peakTimeSec,
        audioEnvelope,
        audioDurationSec,
      });
    },
    [eqBoost, sfxCrack, peakTimeSec, audioEnvelope, audioDurationSec],
  );

  const draw = useCallback(
    (timeSec: number) => {
      const port = workerPortRef.current;
      if (port && workerActiveRef.current) {
        postWaveformFrame(port, {
          timeSec,
          eqBoost,
          sfxCrack,
          peakTimeSec,
        });
        return;
      }
      drawMainThread(timeSec);
    },
    [drawMainThread, eqBoost, sfxCrack, peakTimeSec],
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || typeof canvas.transferControlToOffscreen !== "function") {
      return;
    }

    let cancelled = false;

    void (async () => {
      const rect = canvas.getBoundingClientRect();
      const w = rect.width || canvas.clientWidth;
      const h = rect.height || canvas.clientHeight;
      if (w === 0 || h === 0) return;

      const offscreen = canvas.transferControlToOffscreen();
      const port = await attachWaveformOffscreen(
        offscreen,
        w,
        h,
        window.devicePixelRatio || 1,
      );
      if (cancelled || !port) return;

      workerPortRef.current = port;
      workerActiveRef.current = true;
      if (audioEnvelope?.length) {
        postWaveformEnvelope(port, {
          envelope: audioEnvelope,
          durationSec: audioDurationSec,
        });
      }
      draw(getTimeRef.current());
    })();

    return () => {
      cancelled = true;
      workerPortRef.current = null;
      workerActiveRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- attach once per canvas mount
  }, []);

  useEffect(() => {
    const port = workerPortRef.current;
    if (!port || !workerActiveRef.current) return;
    if (audioEnvelope?.length) {
      postWaveformEnvelope(port, {
        envelope: audioEnvelope,
        durationSec: audioDurationSec,
      });
    }
    draw(getTimeRef.current());
  }, [audioEnvelope, audioDurationSec, draw]);

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
    if (!canvas || workerActiveRef.current) return;

    const observer = new ResizeObserver(() => draw(getTimeRef.current()));
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [draw]);

  return canvasRef;
}
