import type { PipelineStage, PipelineStageId } from "./types";

export const PIPELINE_STAGES: PipelineStage[] = [
  {
    id: "eq",
    label: "Audio Peak Detection & ASMR EQ Boost",
    logMessage: "Peaks locked @ 4.2s · ASMR EQ +6.5 dB @ 3.5kHz applied",
  },
  {
    id: "whisper",
    label: "Whisper Auto-Captions",
    logMessage: "Whisper v3 · 47 caption segments · karaoke timing synced",
  },
  {
    id: "remotion",
    label: "Remotion 9:16 Video Render",
    logMessage: "Remotion Lambda · 1080×1920 H.264 · micro-zoom @ peak",
  },
  {
    id: "thumbnail",
    label: "High-CTR Thumbnail Extraction",
    logMessage: "Frame grab @ 00:04.2 · contrast boost · headline overlay",
  },
  {
    id: "gpt",
    label: "GPT-4o Copy & Hashtags",
    logMessage: "GPT-4o · IG/TikTok/Shorts variants · 12 hashtag clusters",
  },
  {
    id: "dispatch",
    label: "Social Multi-Dispatch",
    logMessage: "Ayrshare queue ready · 4 platforms armed",
  },
];

export const STAGE_DURATION_MS = 1100;

export function createInitialStageStatus(): Record<
  PipelineStageId,
  "idle" | "running" | "done"
> {
  return {
    eq: "idle",
    whisper: "idle",
    remotion: "idle",
    thumbnail: "idle",
    gpt: "idle",
    dispatch: "idle",
  };
}

export function formatLogTimestamp(date = new Date()): string {
  return date.toLocaleTimeString("en-US", { hour12: false });
}

export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
