"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { drawWaveformFrame } from "@/lib/waveform/draw-frame";
import {
  connectWaveformSharedWorkerPort,
  postWaveformEnvelope,
  postWaveformFrame,
  postWaveformOffscreenAttach,
} from "@/lib/waveform/shared-worker-client";

type WaveformRenderMode = "pending" | "main" | "worker";

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
  const [renderMode, setRenderMode] = useState<WaveformRenderMode>("pending");
  const renderModeRef = useRef<WaveformRenderMode>("pending");
  renderModeRef.current = renderMode;

  useEffect(() => {
    getTimeRef.current = getTimeSec;
  }, [getTimeSec]);

  const drawMainThread = useCallback(
    (timeSec: number) => {
      if (renderModeRef.current !== "main") return;
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
      const mode = renderModeRef.current;
      if (mode === "pending") return;

      const port = workerPortRef.current;
      if (mode === "worker" && port) {
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
    if (!canvas) return;

    let cancelled = false;

    void (async () => {
      const port = await connectWaveformSharedWorkerPort();
      if (cancelled) return;

      const rect = canvas.getBoundingClientRect();
      const w = rect.width || canvas.clientWidth;
      const h = rect.height || canvas.clientHeight;

      if (
        port &&
        w > 0 &&
        h > 0 &&
        typeof canvas.transferControlToOffscreen === "function"
      ) {
        const offscreen = canvas.transferControlToOffscreen();
        workerPortRef.current = port;
        renderModeRef.current = "worker";
        setRenderMode("worker");
        postWaveformOffscreenAttach(
          port,
          offscreen,
          w,
          h,
          window.devicePixelRatio || 1,
        );
        if (audioEnvelope?.length) {
          postWaveformEnvelope(port, {
            envelope: audioEnvelope,
            durationSec: audioDurationSec,
          });
        }
      } else {
        renderModeRef.current = "main";
        setRenderMode("main");
      }

      draw(getTimeRef.current());
    })();

    return () => {
      cancelled = true;
      workerPortRef.current = null;
      renderModeRef.current = "pending";
      setRenderMode("pending");
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- pick render path once per canvas mount
  }, []);

  useEffect(() => {
    const port = workerPortRef.current;
    if (renderModeRef.current !== "worker" || !port) return;
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
    if (renderMode !== "main") return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const observer = new ResizeObserver(() => draw(getTimeRef.current()));
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [draw, renderMode]);

  return canvasRef;
}
