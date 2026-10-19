import { z } from "zod";

export const captionWordSchema = z.object({
  word: z.string(),
  start: z.number(),
  end: z.number(),
});

export const captionSegmentSchema = z.object({
  start: z.number().min(0),
  end: z.number().min(0),
  text: z.string(),
  words: z.array(captionWordSchema).optional(),
});

export type CaptionSegmentContract = z.infer<typeof captionSegmentSchema>;
