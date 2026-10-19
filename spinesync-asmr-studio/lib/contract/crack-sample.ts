import { z } from "zod";

export const crackSampleIdSchema = z.enum([
  "syn-bright",
  "syn-warm",
  "syn-deep",
  "syn-ribbon",
]);

export type CrackSampleIdContract = z.infer<typeof crackSampleIdSchema>;
