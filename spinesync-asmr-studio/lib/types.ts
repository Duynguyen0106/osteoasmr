export type FocusCategory = "neck" | "lumbar" | "thoracic" | "shoulder-hip";

export type PipelineStageId =
  | "eq"
  | "whisper"
  | "remotion"
  | "thumbnail"
  | "gpt"
  | "dispatch";

export type StageStatus = "idle" | "running" | "done";

export interface PipelineStage {
  id: PipelineStageId;
  label: string;
  logMessage: string;
}

export interface LogEntry {
  id: string;
  ts: string;
  message: string;
}

export interface ProcessingToggles {
  autoPeakZoom: boolean;
  sfxCrack: boolean;
  tiktokSubs: boolean;
}

export interface SamplePreset {
  id: string;
  label: string;
  focus: FocusCategory;
  headline: string;
  subtitles: string[];
  peakDb: number;
  freqGainDb: number;
  freqKhz: number;
}

export type CopyTab = "instagram" | "youtube" | "hashtags";

export interface PipelineState {
  running: boolean;
  progress: number;
  currentStageId: PipelineStageId | null;
  stages: Record<PipelineStageId, StageStatus>;
}

export interface PipelineRunContext {
  eqBoost: number;
  toggles: ProcessingToggles;
  focus: FocusCategory;
  sourceLabel: string;
}
