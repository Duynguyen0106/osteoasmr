"use client";

import { Pause, Play } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { PEAK_TIME_SEC } from "@/lib/waveform";
import { SubtitleOverlay } from "./SubtitleOverlay";
import { WaveformCanvas } from "./WaveformCanvas";
import type { SamplePreset } from "@/lib/types";

const MOCK_DURATION_SEC = 12;

interface VerticalReelPlayerProps {
  preset: SamplePreset;
  eqBoost: number;
  tiktokSubs: boolean;
  autoPeakZoom: boolean;
  videoUrl: string | null;
}

export function VerticalReelPlayer({
  preset,
  eqBoost,
  tiktokSubs,
  autoPeakZoom,
  videoUrl,
}: VerticalReelPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [subtitleIndex, setSubtitleIndex] = useState(0);
  const [playbackTimeSec, setPlaybackTimeSec] = useState(0);
  const mockStartRef = useRef(0);
  const mockOffsetRef = useRef(0);

  useEffect(() => {
    if (!isPlaying) return;
    const id = setInterval(() => {
      setSubtitleIndex((i) => (i + 1) % preset.subtitles.length);
    }, 2800);
    return () => clearInterval(id);
  }, [isPlaying, preset.subtitles.length]);

  useEffect(() => {
    if (!isPlaying || videoUrl) return;

    mockStartRef.current = performance.now() - mockOffsetRef.current * 1000;

    let raf = 0;
    const tick = (now: number) => {
      let t = (now - mockStartRef.current) / 1000;
      if (t >= MOCK_DURATION_SEC) {
        t = 0;
        mockStartRef.current = now;
      }
      mockOffsetRef.current = t;
      setPlaybackTimeSec(t);
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [isPlaying, videoUrl]);

  const handleTimeUpdate = useCallback(() => {
    const video = videoRef.current;
    if (video) setPlaybackTimeSec(video.currentTime);
  }, []);

  const togglePlay = useCallback(async () => {
    const video = videoRef.current;
    if (videoUrl && video) {
      if (video.paused) {
        await video.play();
        setIsPlaying(true);
      } else {
        video.pause();
        setIsPlaying(false);
      }
      return;
    }
    setIsPlaying((p) => !p);
  }, [videoUrl]);

  const subtitle = preset.subtitles[subtitleIndex];
  const nearPeak = Math.abs(playbackTimeSec - PEAK_TIME_SEC) <= 0.35;
  const zoomClass =
    autoPeakZoom && nearPeak && isPlaying
      ? "scale-[1.06] transition-transform duration-300"
      : "scale-100 transition-transform duration-300";

  return (
    <div className="glass-panel rounded-2xl p-4">
      <h3 className="mb-3 text-sm font-semibold text-white">9:16 Reel Preview</h3>
      <div className="mx-auto max-w-[280px]">
        <div
          className={`neon-border relative aspect-[9/16] overflow-hidden rounded-2xl bg-gradient-to-b from-slate-800 via-slate-900 to-black ${zoomClass}`}
        >
          {videoUrl ? (
            <video
              ref={videoRef}
              src={videoUrl}
              className="absolute inset-0 h-full w-full object-cover"
              playsInline
              muted
              loop
              onTimeUpdate={handleTimeUpdate}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
            />
          ) : (
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(6,182,212,0.12),transparent_55%)]" />
          )}

          <div className="absolute left-0 right-0 top-0 z-20 flex items-center gap-2 bg-gradient-to-b from-black/80 to-transparent p-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-cyan-500/30 text-xs font-bold text-cyan-100">
              DS
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-white">
                Dr. Smith | SpineSync
              </p>
              <p className="text-[10px] text-slate-400">Licensed Clinic</p>
            </div>
            <span className="rounded bg-purple-500/30 px-2 py-0.5 text-[10px] font-bold text-purple-200">
              ASMR
            </span>
          </div>

          <SubtitleOverlay text={subtitle} enabled={tiktokSubs} />

          <WaveformCanvas playbackTimeSec={playbackTimeSec} eqBoost={eqBoost} />

          <div className="absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-black/90 to-transparent p-3 pt-8 text-center text-[10px] text-slate-200">
            📍 SpineSync Clinic | Book Link in Bio
          </div>

          <button
            type="button"
            aria-pressed={isPlaying}
            onClick={() => void togglePlay()}
            className="absolute left-1/2 top-1/2 z-30 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-cyan-400/40 bg-black/50 text-white backdrop-blur-sm transition hover:bg-cyan-500/20"
          >
            {isPlaying ? (
              <Pause className="h-6 w-6" />
            ) : (
              <Play className="h-6 w-6 pl-0.5" />
            )}
          </button>
        </div>
        <p className="mt-2 text-center font-mono text-[10px] text-slate-500">
          1080×1920 scaled preview · peak @ 00:04.2
          {videoUrl ? " · live ingest" : ""}
        </p>
      </div>
    </div>
  );
}
