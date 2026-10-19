import fs from "fs";
import path from "path";
import { uploadRoot } from "../paths";
import type { StorageProvider } from "./types";

export class LocalStorageProvider implements StorageProvider {
  driver = "local" as const;

  private resolve(key: string) {
    const root = uploadRoot();
    const full = path.join(root, key);
    const resolved = path.resolve(full);
    if (!resolved.startsWith(path.resolve(root))) {
      throw new Error("Invalid storage key");
    }
    return resolved;
  }

  async putLocalFile(key: string, localPath: string) {
    const dest = this.resolve(key);
    await fs.promises.mkdir(path.dirname(dest), { recursive: true });
    await fs.promises.copyFile(localPath, dest);
  }

  async getReadableUrl(key: string) {
    return `/api/media/${key.split(path.sep).join("/")}`;
  }

  async getPresignedUploadUrl(key: string) {
    return {
      url: `/api/assets/upload-direct?key=${encodeURIComponent(key)}`,
      headers: {},
    };
  }

  async headObject(key: string) {
    try {
      const stat = await fs.promises.stat(this.resolve(key));
      return { bytes: stat.size };
    } catch {
      return null;
    }
  }

  async downloadToLocal(key: string, destPath: string) {
    await fs.promises.mkdir(path.dirname(destPath), { recursive: true });
    await fs.promises.copyFile(this.resolve(key), destPath);
  }
}
