import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import fs from "fs";
import { DATA_ROOT, DB_PATH } from "../paths";
import * as schema from "./schema";

function ensureSchema(sqlite: Database.Database) {
  sqlite.exec(`
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
}

const globalForDb = globalThis as unknown as {
  sqlite?: Database.Database;
  db?: ReturnType<typeof drizzle>;
};

export function getDb() {
  if (!globalForDb.db) {
    fs.mkdirSync(DATA_ROOT, { recursive: true });
    const sqlite = new Database(DB_PATH);
    ensureSchema(sqlite);
    globalForDb.sqlite = sqlite;
    globalForDb.db = drizzle(sqlite, { schema });
  }
  return globalForDb.db;
}

export { schema };
