import { z } from "zod";
import { crackSampleIdSchema } from "@/lib/contract/crack-sample";
import { focusCategorySchema, processingTogglesSchema } from "@/lib/contract/job";

export { crackSampleIdSchema };

export const asmrPresetPayloadSchema = z.object({
  name: z.string().min(1).max(80),
  focus: focusCategorySchema,
  eqBoost: z.number().min(0).max(100),
  crackIntensity: z.number().min(0).max(100),
  roomTone: z.boolean(),
  bypassSculpt: z.boolean(),
  exportBypassSculpt: z.boolean(),
  crackSampleId: crackSampleIdSchema,
  toggles: processingTogglesSchema,
  liveAsmrPreview: z.boolean().optional(),
});

export type AsmrPresetPayload = z.infer<typeof asmrPresetPayloadSchema>;

export interface AsmrPresetRecord extends AsmrPresetPayload {
  id: string;
  projectId: string;
  createdAt: string;
  updatedAt: string;
}
