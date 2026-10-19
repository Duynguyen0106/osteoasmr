import fs from "fs";
import path from "path";
import { getDb, schema } from "./db";
import { assetPath, UPLOAD_ROOT } from "./paths";
import { probeDurationSec } from "./ffmpeg";

export async function saveUploadedAsset(file: File) {
  const id = crypto.randomUUID();
  const buffer = Buffer.from(await file.arrayBuffer());
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const dest = assetPath(id, safeName);
  await fs.promises.mkdir(path.dirname(dest), { recursive: true });
  await fs.promises.writeFile(dest, buffer);

  const durationSec = await probeDurationSec(dest);

  const db = getDb();
  db.insert(schema.assets)
    .values({
      id,
      filename: file.name,
      mime: file.type || "video/mp4",
      bytes: buffer.length,
      storagePath: dest,
      durationSec: durationSec ? Math.round(durationSec) : null,
      createdAt: new Date(),
    })
    .run();

  await fs.promises.mkdir(UPLOAD_ROOT, { recursive: true });

  return {
    assetId: id,
    filename: file.name,
    bytes: buffer.length,
    durationSec,
  };
}
