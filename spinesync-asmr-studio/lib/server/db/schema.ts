import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const assets = sqliteTable("assets", {
  id: text("id").primaryKey(),
  filename: text("filename").notNull(),
  mime: text("mime").notNull(),
  bytes: integer("bytes").notNull(),
  storagePath: text("storage_path").notNull(),
  durationSec: integer("duration_sec"),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
});

export const jobs = sqliteTable("jobs", {
  id: text("id").primaryKey(),
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
