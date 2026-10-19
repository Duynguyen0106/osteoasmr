import { z } from "zod";
import { reelEditSchema } from "@/lib/contract/reel-edit";

export const previewReelBodySchema = z.object({
  assetId: z.string().min(1),
  edit: reelEditSchema.optional(),
  autoPeakZoom: z.boolean().default(true),
  zoomIntensity: z.number().min(0).max(100).optional(),
  /** Burn-in text for quick thumbnail (defaults to preset headline client-side). */
  headline: z.string().max(120).optional(),
});

export type PreviewReelBody = z.infer<typeof previewReelBodySchema>;
