"use client";

import { Pause, Play, Volume2, VolumeX } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { CaptionSegment } from "@/lib/contract/job";
import { ReelScrubber } from "./ReelScrubber";
import { SubtitleOverlay } from "./SubtitleOverlay";
import { WaveformCanvas } from "./WaveformCanvas";
import { useLiveAsmrAudio } from "@/hooks/useLiveAsmrAudio";
import type { CrackSampleId } from "@/lib/crack-samples";
import type { FocusCategory, SamplePreset } from "@/lib/types";

const MOCK_DURATION_SEC = 12;

interface VerticalReelPlayerProps {
  preset: SamplePreset;
  eqBoost: number;
  tiktokSubs: boolean;
  autoPeakZoom: boolean;
  sfxCrack: boolean;
  videoUrl: string | null;
  peakTimeSec: number;
  captionSegments?: CaptionSegment[] | null;
  onRefreshMedia?: () => void;
  audioEnvelope?: number[] | null;
  audioDurationSec?: number;
  focus: FocusCategory;
  liveAsmrPreview?: boolean;
  previewBypass?: boolean;
  crackIntensity?: number;
  crackSampleId?: CrackSampleId;
}

export function VerticalReelPlayer({
  preset,
  eqBoost,
  tiktokSubs,
  autoPeakZoom,
  sfxCrack,
  videoUrl,
  peakTimeSec,
  captionSegments,
  onRefreshMedia,
  audioEnvelope = null,
  audioDurationSec = 0,
  focus,
  liveAsmrPreview = false,
  previewBypass = false,
  crackIntensity = 65,
  crackSampleId = "syn-bright",
}: VerticalReelPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const timeRef = useRef(0);
  const isPlayingRef = useRef(false);
  const mockStartRef = useRef(0);
  const mockOffsetRef = useRef(0);

  const [isPlaying, setIsPlaying] = useState(false);
  const [subtitleIndex, setSubtitleIndex] = useState(0);
  const [mediaError, setMediaError] = useState<{
    url: string;
    message: string;
  } | null>(null);
  const playError =
    mediaError && mediaError.url === videoUrl ? mediaError.message : null;
  const [displayTimeSec, setDisplayTimeSec] = useState(0);
  const [soundOn, setSoundOn] = useState(true);
  const [videoDurationSec, setVideoDurationSec] = useState(0);
  const hasKaraoke = Boolean(captionSegments?.length);

  const durationSec =
    videoUrl && videoDurationSec > 0
      ? videoDurationSec
      : audioDurationSec > 0
        ? audioDurationSec
        : MOCK_DURATION_SEC;

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  const applyPeakZoom = useCallback(
    (timeSec: number) => {
      const el = frameRef.current;
      if (!el) return;
      if (!autoPeakZoom) {
        el.style.transform = "scale(1)";
        return;
      }
      const nearPeak = Math.abs(timeSec - peakTimeSec) <= 0.35;
      const playing = isPlayingRef.current;
      el.style.transform = nearPeak && playing ? "scale(1.06)" : "scale(1)";
    },
    [autoPeakZoom, peakTimeSec],
  );

  const getTimeSec = useCallback(() => timeRef.current, []);

  useLiveAsmrAudio(videoRef, {
    enabled: liveAsmrPreview && Boolean(videoUrl),
    videoUrl,
    soundOn,
    focus,
    eqBoost,
    bypassSculpt: previewBypass,
    sfxCrackPreview: sfxCrack,
    crackIntensity,
    crackSampleId,
    peakTimeSec,
    isPlaying,
    getTimeSec,
  });

  useEffect(() => {
    if (!isPlaying || hasKaraoke) return;
    const id = setInterval(() => {
      setSubtitleIndex((i) => (i + 1) % preset.subtitles.length);
    }, 2800);
    return () => clearInterval(id);
  }, [isPlaying, preset.subtitles.length, hasKaraoke]);

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
      timeRef.current = t;
      setDisplayTimeSec(t);
      applyPeakZoom(t);
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [isPlaying, videoUrl, applyPeakZoom, hasKaraoke]);

  const handleTimeUpdate = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    timeRef.current = video.currentTime;
    if (hasKaraoke) setDisplayTimeSec(video.currentTime);
    applyPeakZoom(video.currentTime);
  }, [applyPeakZoom, hasKaraoke]);

  const applySoundToVideo = useCallback(
    (video: HTMLVideoElement, enabled: boolean) => {
      video.muted = !enabled;
      video.volume = enabled ? 1 : 0;
    },
    [],
  );

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !videoUrl) return;
    applySoundToVideo(video, soundOn);
  }, [videoUrl, soundOn, applySoundToVideo]);

  const toggleSound = useCallback(() => {
    setSoundOn((on) => !on);
  }, []);

  const togglePlay = useCallback(async () => {
    setMediaError(null);
    const video = videoRef.current;
    if (videoUrl && video) {
      try {
        if (video.paused) {
          applySoundToVideo(video, soundOn);
          await video.play();
          setIsPlaying(true);
        } else {
          video.pause();
          setIsPlaying(false);
        }
      } catch {
        if (videoUrl) {
          setMediaError({
            url: videoUrl,
            message: "Playback blocked — try clicking play again.",
          });
        }
        setIsPlaying(false);
      }
      return;
    }
    setIsPlaying((p) => !p);
  }, [videoUrl, soundOn, applySoundToVideo]);

  useEffect(() => {
    if (!isPlaying) applyPeakZoom(timeRef.current);
  }, [isPlaying, applyPeakZoom]);

  useEffect(() => {
    if (!videoUrl?.includes("exp=") || !onRefreshMedia) return;
    const intervalMs = 45 * 60 * 1000;
    const id = window.setInterval(() => onRefreshMedia(), intervalMs);
    return () => window.clearInterval(id);
  }, [videoUrl, onRefreshMedia]);

  const handleSeek = useCallback(
    (timeSec: number) => {
      const clamped = Math.max(0, Math.min(timeSec, durationSec));
      timeRef.current = clamped;
      setDisplayTimeSec(clamped);
      applyPeakZoom(clamped);
      const video = videoRef.current;
      if (videoUrl && video) {
        video.currentTime = clamped;
        return;
      }
      mockOffsetRef.current = clamped;
    },
    [durationSec, videoUrl, applyPeakZoom],
  );

  const handleLoadedMetadata = useCallback(() => {
    const video = videoRef.current;
    if (video && Number.isFinite(video.duration)) {
      setVideoDurationSec(video.duration);
    }
  }, []);

  const handleVideoError = useCallback(() => {
    if (videoUrl) {
      setMediaError({
        url: videoUrl,
        message: "Preview link expired — refreshing…",
      });
    }
    onRefreshMedia?.();
  }, [onRefreshMedia, videoUrl]);

  const subtitle = preset.subtitles[subtitleIndex];

  return (
    <div className="glass-panel rounded-2xl p-4">
      <h3 className="mb-3 text-sm font-semibold text-white">9:16 Reel Preview</h3>
      <div className="mx-auto max-w-[280px]">
        <div
          ref={frameRef}
          className="neon-border relative aspect-[9/16] overflow-hidden rounded-2xl bg-gradient-to-b from-slate-800 via-slate-900 to-black transition-transform duration-300"
        >
          {videoUrl ? (
            <video
              ref={videoRef}
              src={videoUrl}
              className="absolute inset-0 h-full w-full object-cover"
              playsInline
              loop
              onTimeUpdate={handleTimeUpdate}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onError={handleVideoError}
              onLoadedMetadata={handleLoadedMetadata}
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

          {sfxCrack && (
            <span className="absolute right-2 top-14 z-20 rounded bg-amber-500/20 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-amber-200 ring-1 ring-amber-400/30">
              SFX Crack Layer
            </span>
          )}

          <SubtitleOverlay
            text={subtitle}
            enabled={tiktokSubs}
            segments={captionSegments}
            playbackTimeSec={displayTimeSec}
          />

          <WaveformCanvas
            isPlaying={isPlaying}
            eqBoost={eqBoost}
            sfxCrack={sfxCrack}
            getTimeSec={getTimeSec}
            peakTimeSec={peakTimeSec}
            audioEnvelope={audioEnvelope}
            audioDurationSec={audioDurationSec}
          />

          <div className="absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-black/90 to-transparent p-3 pt-8 text-center text-[10px] text-slate-200">
            📍 SpineSync Clinic | Book Link in Bio
          </div>

          {videoUrl && (
            <button
              type="button"
              aria-pressed={soundOn}
              aria-label={soundOn ? "Mute preview audio" : "Unmute preview audio"}
              onClick={toggleSound}
              className="absolute bottom-16 right-3 z-30 flex h-9 w-9 items-center justify-center rounded-full border border-cyan-400/30 bg-black/55 text-white backdrop-blur-sm transition hover:bg-cyan-500/20"
            >
              {soundOn ? (
                <Volume2 className="h-4 w-4" aria-hidden />
              ) : (
                <VolumeX className="h-4 w-4" aria-hidden />
              )}
            </button>
          )}

          <button
            type="button"
            aria-pressed={isPlaying}
            aria-label={isPlaying ? "Pause preview" : "Play preview"}
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
        <ReelScrubber
          durationSec={durationSec}
          currentTimeSec={displayTimeSec}
          peakTimeSec={peakTimeSec}
          onSeek={handleSeek}
        />
        {playError && (
          <p className="mt-2 text-center text-xs text-amber-400" role="alert">
            {playError}
          </p>
        )}
        <p className="mt-2 text-center font-mono text-[10px] text-slate-500">
          1080×1920 scaled preview · peak @ 00:
          {peakTimeSec.toFixed(1)}s
          {videoUrl ? " · live ingest" : ""}
          {videoUrl && soundOn ? " · audio on" : videoUrl ? " · muted" : ""}
        </p>
      </div>
    </div>
  );
}
