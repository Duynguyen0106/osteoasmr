import { z } from "zod";
import { captionSegmentSchema } from "@/lib/contract/caption-segment";

export const reelMarkerSchema = z.object({
  id: z.string(),
  timeSec: z.number().min(0),
  label: z.string().max(80).optional(),
  color: z.enum(["amber", "cyan", "rose", "violet"]).default("cyan"),
});

export const brollOverlaySchema = z.object({
  id: z.string(),
  assetId: z.string().min(1),
  label: z.string().max(120).optional(),
  /** Main source timeline in-point (seconds) */
  startSec: z.number().min(0),
  /** Main source timeline out-point (seconds) */
  endSec: z.number().min(0),
  /** Trim into B-roll file at overlay start */
  brollInSec: z.number().min(0).default(0),
});

export const reelEditSchema = z.object({
  /** Timeline in-point (seconds from source start) */
  trimInSec: z.number().min(0).default(0),
  /** Timeline out-point; null = full source duration */
  trimOutSec: z.number().min(0).nullable().default(null),
  /** Manual peak on timeline (0 = trim in); null = auto-detect on export */
  peakTimeSec: z.number().min(0).nullable().default(null),
  /** Optional caption overrides (skip Whisper when set) */
  captions: z.array(captionSegmentSchema).optional(),
  markers: z.array(reelMarkerSchema).default([]),
  brollOverlays: z.array(brollOverlaySchema).default([]),
  /** 0–100 micro-zoom intensity @ peak */
  zoomIntensity: z.number().min(0).max(100).default(100),
});

export type ReelEditState = z.infer<typeof reelEditSchema>;
export type ReelMarker = z.infer<typeof reelMarkerSchema>;
export type BrollOverlay = z.infer<typeof brollOverlaySchema>;

export function defaultReelEdit(durationSec: number): ReelEditState {
  return reelEditSchema.parse({
    trimInSec: 0,
    trimOutSec: durationSec > 0 ? durationSec : null,
    peakTimeSec: null,
    markers: [],
    brollOverlays: [],
    zoomIntensity: 100,
  });
}
