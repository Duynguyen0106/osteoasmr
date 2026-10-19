import { desc, eq } from "drizzle-orm";
import type { AsmrPresetPayload, AsmrPresetRecord } from "@/lib/contract/asmr-preset";
import { asmrPresetPayloadSchema } from "@/lib/contract/asmr-preset";
import type { ProcessingToggles } from "@/lib/types";
import { getDb, schema } from "./db";

function rowToRecord(row: typeof schema.asmrPresets.$inferSelect): AsmrPresetRecord {
  return {
    id: row.id,
    projectId: row.projectId,
    name: row.name,
    focus: row.focus as AsmrPresetRecord["focus"],
    eqBoost: row.eqBoost,
    crackIntensity: row.crackIntensity,
    roomTone: row.roomTone,
    bypassSculpt: row.bypassSculpt,
    exportBypassSculpt: row.exportBypassSculpt,
    crackSampleId: row.crackSampleId as AsmrPresetRecord["crackSampleId"],
    toggles: JSON.parse(row.togglesJson) as ProcessingToggles,
    liveAsmrPreview: row.liveAsmrPreview,
    createdAt: new Date(row.createdAt).toISOString(),
    updatedAt: new Date(row.updatedAt).toISOString(),
  };
}

export function listAsmrPresets(projectId: string): AsmrPresetRecord[] {
  const rows = getDb()
    .select()
    .from(schema.asmrPresets)
    .where(eq(schema.asmrPresets.projectId, projectId))
    .orderBy(desc(schema.asmrPresets.updatedAt))
    .all();
  return rows.map(rowToRecord);
}

export function createAsmrPreset(projectId: string, payload: AsmrPresetPayload) {
  const parsed = asmrPresetPayloadSchema.parse(payload);
  const id = `asmr_${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`;
  const now = new Date();
  getDb()
    .insert(schema.asmrPresets)
    .values({
      id,
      projectId,
      name: parsed.name,
      focus: parsed.focus,
      eqBoost: parsed.eqBoost,
      crackIntensity: parsed.crackIntensity,
      roomTone: parsed.roomTone,
      bypassSculpt: parsed.bypassSculpt,
      exportBypassSculpt: parsed.exportBypassSculpt,
      crackSampleId: parsed.crackSampleId,
      togglesJson: JSON.stringify(parsed.toggles),
      liveAsmrPreview: parsed.liveAsmrPreview ?? true,
      createdAt: now,
      updatedAt: now,
    })
    .run();
  return rowToRecord(
    getDb()
      .select()
      .from(schema.asmrPresets)
      .where(eq(schema.asmrPresets.id, id))
      .get()!,
  );
}

export function updateAsmrPreset(
  projectId: string,
  presetId: string,
  payload: AsmrPresetPayload,
) {
  const parsed = asmrPresetPayloadSchema.parse(payload);
  const existing = getDb()
    .select()
    .from(schema.asmrPresets)
    .where(eq(schema.asmrPresets.id, presetId))
    .get();
  if (!existing || existing.projectId !== projectId) return null;

  const now = new Date();
  getDb()
    .update(schema.asmrPresets)
    .set({
      name: parsed.name,
      focus: parsed.focus,
      eqBoost: parsed.eqBoost,
      crackIntensity: parsed.crackIntensity,
      roomTone: parsed.roomTone,
      bypassSculpt: parsed.bypassSculpt,
      exportBypassSculpt: parsed.exportBypassSculpt,
      crackSampleId: parsed.crackSampleId,
      togglesJson: JSON.stringify(parsed.toggles),
      liveAsmrPreview: parsed.liveAsmrPreview ?? true,
      updatedAt: now,
    })
    .where(eq(schema.asmrPresets.id, presetId))
    .run();

  return rowToRecord(
    getDb()
      .select()
      .from(schema.asmrPresets)
      .where(eq(schema.asmrPresets.id, presetId))
      .get()!,
  );
}

export function deleteAsmrPreset(projectId: string, presetId: string) {
  const existing = getDb()
    .select()
    .from(schema.asmrPresets)
    .where(eq(schema.asmrPresets.id, presetId))
    .get();
  if (!existing || existing.projectId !== projectId) return false;
  getDb().delete(schema.asmrPresets).where(eq(schema.asmrPresets.id, presetId)).run();
  return true;
}
