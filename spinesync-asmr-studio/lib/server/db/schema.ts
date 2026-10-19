import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const projects = sqliteTable("projects", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  apiKey: text("api_key").notNull().unique(),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
});

export const assets = sqliteTable("assets", {
  id: text("id").primaryKey(),
  projectId: text("project_id"),
  filename: text("filename").notNull(),
  mime: text("mime").notNull(),
  bytes: integer("bytes").notNull(),
  storagePath: text("storage_path").notNull(),
  storageDriver: text("storage_driver").default("local"),
  storageKey: text("storage_key"),
  status: text("status").default("ready"),
  durationSec: integer("duration_sec"),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
});

export const jobs = sqliteTable("jobs", {
  id: text("id").primaryKey(),
  projectId: text("project_id"),
  assetId: text("asset_id"),
  status: text("status").notNull(),
  configJson: text("config_json").notNull(),
  resultJson: text("result_json"),
  progress: integer("progress").notNull().default(0),
  currentStage: text("current_stage"),
  copyRevision: integer("copy_revision").notNull().default(0),
  error: text("error"),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
});

export const jobLogs = sqliteTable("job_logs", {
  id: text("id").primaryKey(),
  jobId: text("job_id").notNull(),
  ts: text("ts").notNull(),
  message: text("message").notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
});

export const asmrPresets = sqliteTable("asmr_presets", {
  id: text("id").primaryKey(),
  projectId: text("project_id").notNull(),
  name: text("name").notNull(),
  focus: text("focus").notNull(),
  eqBoost: integer("eq_boost").notNull(),
  crackIntensity: integer("crack_intensity").notNull(),
  roomTone: integer("room_tone", { mode: "boolean" }).notNull(),
  bypassSculpt: integer("bypass_sculpt", { mode: "boolean" }).notNull(),
  exportBypassSculpt: integer("export_bypass_sculpt", { mode: "boolean" }).notNull(),
  crackSampleId: text("crack_sample_id").notNull(),
  togglesJson: text("toggles_json").notNull(),
  liveAsmrPreview: integer("live_asmr_preview", { mode: "boolean" })
    .notNull()
    .default(true),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
});
