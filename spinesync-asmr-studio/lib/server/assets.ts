import fs from "fs";
import path from "path";
import { eq } from "drizzle-orm";
import { ensureDefaultProject } from "./auth";
import { getDb, schema } from "./db";
import { probeDurationSec } from "./ffmpeg";
import { assetPath } from "./paths";
import { assetStorageKey, getStorage } from "./storage";

export async function saveUploadedAsset(file: File, projectId?: string) {
  const pid = projectId ?? ensureDefaultProject().id;
  const id = crypto.randomUUID();
  const buffer = Buffer.from(await file.arrayBuffer());
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const storage = getStorage();
  const key = assetStorageKey(pid, id, safeName);
  const dest = assetPath(id, safeName);

  await fs.promises.mkdir(path.dirname(dest), { recursive: true });
  await fs.promises.writeFile(dest, buffer);

  if (storage.driver !== "local") {
    await storage.putLocalFile(key, dest);
  }

  const durationSec = await probeDurationSec(dest);

  return registerAsset({
    id,
    projectId: pid,
    filename: file.name,
    mime: file.type || "video/mp4",
    bytes: buffer.length,
    storageDriver: storage.driver,
    storageKey: key,
    storagePath: dest,
    status: "ready",
    durationSec,
  });
}

export async function createPresignedAsset(input: {
  projectId: string;
  filename: string;
  mime: string;
  bytes: number;
}) {
  const storage = getStorage();
  const id = crypto.randomUUID();
  const safeName = input.filename.replace(/[^a-zA-Z0-9._-]/g, "_");
  const key = assetStorageKey(input.projectId, id, safeName);
  const { url, headers } = await storage.getPresignedUploadUrl(
    key,
    input.mime,
  );

  registerAsset({
    id,
    projectId: input.projectId,
    filename: input.filename,
    mime: input.mime,
    bytes: input.bytes,
    storageDriver: storage.driver,
    storageKey: key,
    storagePath: assetPath(id, safeName),
    status: "pending",
    durationSec: null,
  });

  return {
    assetId: id,
    storageKey: key,
    uploadUrl: url,
    method: "PUT" as const,
    headers,
  };
}

export async function completePresignedAsset(assetId: string) {
  const db = getDb();
  const asset = db
    .select()
    .from(schema.assets)
    .where(eq(schema.assets.id, assetId))
    .get();
  if (!asset) throw new Error("Asset not found");
  if (!asset.storageKey) throw new Error("Asset missing storage key");

  const storage = getStorage();
  const head = await storage.headObject(asset.storageKey);
  const bytes = head?.bytes ?? asset.bytes;

  const localPath = await materializeAssetLocalPath({
    storagePath: asset.storagePath,
    storageKey: asset.storageKey,
    storageDriver: asset.storageDriver ?? "local",
  });
  const durationSec = await probeDurationSec(localPath);

  db.update(schema.assets)
    .set({
      bytes,
      status: "ready",
      durationSec: durationSec ? Math.round(durationSec) : null,
    })
    .where(eq(schema.assets.id, assetId))
    .run();

  return {
    assetId,
    bytes,
    durationSec,
  };
}

function registerAsset(input: {
  id: string;
  projectId: string;
  filename: string;
  mime: string;
  bytes: number;
  storageDriver: string;
  storageKey: string;
  storagePath: string;
  status: string;
  durationSec: number | null;
}) {
  const db = getDb();
  db.insert(schema.assets)
    .values({
      id: input.id,
      projectId: input.projectId,
      filename: input.filename,
      mime: input.mime,
      bytes: input.bytes,
      storagePath: input.storagePath,
      storageDriver: input.storageDriver,
      storageKey: input.storageKey,
      status: input.status,
      durationSec: input.durationSec ? Math.round(input.durationSec) : null,
      createdAt: new Date(),
    })
    .run();

  return {
    assetId: input.id,
    filename: input.filename,
    bytes: input.bytes,
    durationSec: input.durationSec,
  };
}

export async function materializeAssetLocalPath(asset: {
  storagePath: string;
  storageKey?: string | null;
  storageDriver?: string | null;
}): Promise<string> {
  if (asset.storageDriver !== "s3" && asset.storageDriver !== "blob") {
    return asset.storagePath;
  }
  if (!asset.storageKey) return asset.storagePath;
  if (fs.existsSync(asset.storagePath)) return asset.storagePath;

  const storage = getStorage();
  await fs.promises.mkdir(path.dirname(asset.storagePath), { recursive: true });
  await storage.downloadToLocal(asset.storageKey, asset.storagePath);
  return asset.storagePath;
}
