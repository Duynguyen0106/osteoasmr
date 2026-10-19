import { z } from "zod";
import { crackSampleIdSchema } from "@/lib/contract/crack-sample";

export const focusCategorySchema = z.enum([
  "neck",
  "lumbar",
  "thoracic",
  "shoulder-hip",
]);

export const processingTogglesSchema = z.object({
  autoPeakZoom: z.boolean(),
  sfxCrack: z.boolean(),
  tiktokSubs: z.boolean(),
});

export const createJobBodySchema = z.object({
  assetId: z.string().optional(),
  presetId: z.string().nullable().optional(),
  focus: focusCategorySchema,
  eqBoost: z.number().min(0).max(100),
  toggles: processingTogglesSchema,
  crackIntensity: z.number().min(0).max(100).default(65),
  roomTone: z.boolean().default(false),
  bypassSculpt: z.boolean().default(false),
  crackSampleId: crackSampleIdSchema.default("syn-bright"),
  sourceLabel: z.string().min(1),
});

export const publishBodySchema = z.object({
  mode: z.enum(["immediate", "queue"]),
  platforms: z
    .array(z.string())
    .default(["Instagram Reels", "TikTok", "YouTube Shorts", "Facebook Reels"]),
});

export type CreateJobBody = z.infer<typeof createJobBodySchema>;
export type PublishBody = z.infer<typeof publishBodySchema>;

export interface PeakResult {
  timeSec: number;
  peakDb: number;
  freqGainDb: number;
  freqKhz: number;
}

export interface JobCopyResult {
  instagram: string;
  youtube: string;
  hashtags: string;
  headline: string;
  revision: number;
}

export interface CaptionSegment {
  start: number;
  end: number;
  text: string;
  words?: { word: string; start: number; end: number }[];
}

export type FocusCategory = z.infer<typeof focusCategorySchema>;

export interface AsmrProfileSnapshot {
  focus: FocusCategory;
  label: string;
  centerHz: number;
  gainDb: number;
  eqBoost: number;
  sfxCrack: boolean;
  crackIntensity: number;
  roomTone: boolean;
  bypassSculpt: boolean;
  crackSampleId: string;
  targetLufs: number;
}

export interface JobResult {
  peak: PeakResult;
  asmrProfile?: AsmrProfileSnapshot;
  artifacts: {
    reel?: string;
    thumb?: string;
    captions?: string;
    copy?: string;
  };
  copy?: JobCopyResult;
  captionSegments?: CaptionSegment[];
  previewUrls?: {
    reel?: string;
    thumb?: string;
    captions?: string;
    karaoke?: string;
    audioEq?: string;
  };
}

export type JobStreamEvent =
  | { type: "log"; id: string; ts: string; message: string }
  | {
      type: "stage";
      stageId: string;
      status: "running" | "done";
      progress: number;
    }
  | { type: "complete"; result: JobResult; copyRevision: number }
  | { type: "error"; message: string };
