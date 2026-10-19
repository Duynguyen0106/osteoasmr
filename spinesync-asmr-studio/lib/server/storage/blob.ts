import fs from "fs";
import path from "path";
import { head, put } from "@vercel/blob";
import type { StorageProvider } from "./types";

function blobToken() {
  const token = process.env.BLOB_READ_WRITE_TOKEN?.trim();
  if (!token) throw new Error("BLOB_READ_WRITE_TOKEN is not configured");
  return token;
}

export class BlobStorageProvider implements StorageProvider {
  driver = "blob" as const;

  async putLocalFile(key: string, localPath: string) {
    const body = await fs.promises.readFile(localPath);
    await put(key, body, {
      access: "public",
      token: blobToken(),
      addRandomSuffix: false,
    });
  }

  async getReadableUrl(key: string) {
    const meta = await head(key, { token: blobToken() });
    if (!meta?.url) throw new Error(`Blob not found: ${key}`);
    return meta.url;
  }

  async getPresignedUploadUrl(key: string) {
    return {
      url: `/api/assets?action=upload&key=${encodeURIComponent(key)}`,
      headers: {},
    };
  }

  async headObject(key: string) {
    try {
      const meta = await head(key, { token: blobToken() });
      return { bytes: meta.size };
    } catch {
      return null;
    }
  }

  async downloadToLocal(key: string, destPath: string) {
    const url = await this.getReadableUrl(key);
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Blob download failed (${res.status})`);
    const bytes = Buffer.from(await res.arrayBuffer());
    await fs.promises.mkdir(path.dirname(destPath), { recursive: true });
    await fs.promises.writeFile(destPath, bytes);
  }
}
