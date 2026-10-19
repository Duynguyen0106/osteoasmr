import { hasS3Config, s3CloudFrontDomain, s3Region, storageDriverEnv } from "../config";
import { LocalStorageProvider } from "./local";
import { S3StorageProvider } from "./s3";
import type { StorageProvider } from "./types";

const globalForStorage = globalThis as unknown as {
  storage?: StorageProvider;
};

export function getStorage(): StorageProvider {
  if (!globalForStorage.storage) {
    const driver = storageDriverEnv();
    if (driver === "s3" && hasS3Config()) {
      globalForStorage.storage = new S3StorageProvider({
        bucket: process.env.AWS_S3_BUCKET!,
        region: s3Region(),
        cloudfrontDomain: s3CloudFrontDomain(),
      });
    } else {
      globalForStorage.storage = new LocalStorageProvider();
    }
  }
  return globalForStorage.storage;
}

export function assetStorageKey(
  projectId: string,
  assetId: string,
  filename: string,
) {
  const safe = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
  return `projects/${projectId}/assets/${assetId}/${safe}`;
}

export function jobArtifactKey(jobId: string, name: string) {
  return `jobs/${jobId}/${name}`;
}
