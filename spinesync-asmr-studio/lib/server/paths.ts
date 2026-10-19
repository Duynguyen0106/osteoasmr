import path from "path";

export const DATA_ROOT = path.join(process.cwd(), ".data");
export const DB_PATH = path.join(DATA_ROOT, "spinesync.db");
export const UPLOAD_ROOT = path.join(DATA_ROOT, "uploads");

export function jobDir(jobId: string) {
  return path.join(UPLOAD_ROOT, "jobs", jobId);
}

export function assetPath(assetId: string, filename: string) {
  return path.join(UPLOAD_ROOT, "assets", assetId, filename);
}
