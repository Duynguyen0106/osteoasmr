import path from "path";

export function dataRoot(): string {
  return process.env.SPINESYNC_DATA_ROOT?.trim()
    ? path.resolve(process.env.SPINESYNC_DATA_ROOT)
    : path.join(process.cwd(), ".data");
}

export function dbPath(): string {
  return path.join(dataRoot(), "spinesync.db");
}

export function uploadRoot(): string {
  return path.join(dataRoot(), "uploads");
}

export function jobDir(jobId: string) {
  return path.join(uploadRoot(), "jobs", jobId);
}

export function assetPath(assetId: string, filename: string) {
  return path.join(uploadRoot(), "assets", assetId, filename);
}
