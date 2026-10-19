import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import fs from "fs";
import { dataRoot, dbPath } from "../paths";
import * as schema from "./schema";
import { validateProductionSecrets } from "../startup";

function columnExists(sqlite: Database.Database, table: string, column: string) {
  const cols = sqlite
    .prepare(`PRAGMA table_info(${table})`)
    .all() as Array<{ name: string }>;
  return cols.some((c) => c.name === column);
}

function ensureSchema(sqlite: Database.Database) {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      api_key TEXT NOT NULL UNIQUE,
      created_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS assets (
      id TEXT PRIMARY KEY,
      filename TEXT NOT NULL,
      mime TEXT NOT NULL,
      bytes INTEGER NOT NULL,
      storage_path TEXT NOT NULL,
      duration_sec INTEGER,
      created_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS jobs (
      id TEXT PRIMARY KEY,
      asset_id TEXT,
      status TEXT NOT NULL,
      config_json TEXT NOT NULL,
      result_json TEXT,
      progress INTEGER NOT NULL DEFAULT 0,
      current_stage TEXT,
      copy_revision INTEGER NOT NULL DEFAULT 0,
      error TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS job_logs (
      id TEXT PRIMARY KEY,
      job_id TEXT NOT NULL,
      ts TEXT NOT NULL,
      message TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS job_logs_job_id ON job_logs(job_id);
  `);

  if (!columnExists(sqlite, "assets", "project_id")) {
    sqlite.exec(`ALTER TABLE assets ADD COLUMN project_id TEXT;`);
  }
  if (!columnExists(sqlite, "assets", "storage_driver")) {
    sqlite.exec(`ALTER TABLE assets ADD COLUMN storage_driver TEXT DEFAULT 'local';`);
  }
  if (!columnExists(sqlite, "assets", "storage_key")) {
    sqlite.exec(`ALTER TABLE assets ADD COLUMN storage_key TEXT;`);
  }
  if (!columnExists(sqlite, "assets", "status")) {
    sqlite.exec(`ALTER TABLE assets ADD COLUMN status TEXT DEFAULT 'ready';`);
  }
  if (!columnExists(sqlite, "jobs", "project_id")) {
    sqlite.exec(`ALTER TABLE jobs ADD COLUMN project_id TEXT;`);
  }

  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS asmr_presets (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      name TEXT NOT NULL,
      focus TEXT NOT NULL,
      eq_boost INTEGER NOT NULL,
      crack_intensity INTEGER NOT NULL,
      room_tone INTEGER NOT NULL,
      bypass_sculpt INTEGER NOT NULL,
      export_bypass_sculpt INTEGER NOT NULL,
      crack_sample_id TEXT NOT NULL,
      toggles_json TEXT NOT NULL,
      live_asmr_preview INTEGER NOT NULL DEFAULT 1,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS asmr_presets_project_id ON asmr_presets(project_id);
  `);
}

const globalForDb = globalThis as unknown as {
  sqlite?: Database.Database;
  db?: ReturnType<typeof drizzle>;
  dataRoot?: string;
};

export function resetDbForTests() {
  if (globalForDb.sqlite) {
    globalForDb.sqlite.close();
  }
  globalForDb.sqlite = undefined;
  globalForDb.db = undefined;
  globalForDb.dataRoot = undefined;
}

export function getDb() {
  validateProductionSecrets();
  const root = dataRoot();
  const databasePath = dbPath();
  if (globalForDb.db && globalForDb.dataRoot !== root) {
    resetDbForTests();
  }
  if (!globalForDb.db) {
    fs.mkdirSync(root, { recursive: true });
    const sqlite = new Database(databasePath);
    ensureSchema(sqlite);
    globalForDb.sqlite = sqlite;
    globalForDb.db = drizzle(sqlite, { schema });
    globalForDb.dataRoot = root;
  }
  return globalForDb.db;
}

export { schema };
