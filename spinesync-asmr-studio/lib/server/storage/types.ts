export type StorageDriver = "local" | "s3" | "blob";

export function isCloudStorageDriver(driver: StorageDriver): boolean {
  return driver === "s3" || driver === "blob";
}

export interface PresignUploadResult {
  assetId: string;
  storageKey: string;
  uploadUrl: string;
  method: "PUT" | "POST";
  headers?: Record<string, string>;
}

export interface StorageProvider {
  driver: StorageDriver;
  putLocalFile(key: string, localPath: string): Promise<void>;
  getReadableUrl(key: string): Promise<string>;
  getPresignedUploadUrl(
    key: string,
    mime: string,
    expiresSec?: number,
  ): Promise<{ url: string; headers?: Record<string, string> }>;
  headObject(key: string): Promise<{ bytes: number } | null>;
  downloadToLocal(key: string, destPath: string): Promise<void>;
}
