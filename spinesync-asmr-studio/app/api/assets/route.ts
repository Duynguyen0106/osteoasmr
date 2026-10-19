import { NextResponse } from "next/server";
import { z } from "zod";
import {
  assertAssetAccess,
  resolveProjectFromRequest,
  unauthorized,
} from "@/lib/server/access";
import {
  completePresignedAsset,
  createPresignedAsset,
  saveUploadedAsset,
} from "@/lib/server/assets";
import { getStorage } from "@/lib/server/storage";

const MAX_BYTES = 500 * 1024 * 1024;

const presignSchema = z.object({
  action: z.literal("presign"),
  filename: z.string().min(1),
  mime: z.string().min(1),
  bytes: z.number().int().positive().max(MAX_BYTES),
});

const completeSchema = z.object({
  action: z.literal("complete"),
  assetId: z.string().min(1),
});

export async function POST(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("multipart/form-data")) {
    try {
      const form = await request.formData();
      const file = form.get("file");
      if (!(file instanceof File)) {
        return NextResponse.json({ error: "Missing file field" }, { status: 400 });
      }

      if (file.size > MAX_BYTES) {
        return NextResponse.json(
          { error: "File exceeds 500MB limit" },
          { status: 413 },
        );
      }

      const ok =
        file.type === "video/mp4" ||
        file.type === "video/quicktime" ||
        /\.(mp4|mov)$/i.test(file.name);
      if (!ok) {
        return NextResponse.json(
          { error: "Only MP4/MOV allowed" },
          { status: 415 },
        );
      }

      const projectId = resolveProjectFromRequest(request);
      if (!projectId) return unauthorized();
      const asset = await saveUploadedAsset(file, projectId);
      return NextResponse.json(asset);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Upload failed";
      return NextResponse.json({ error: message }, { status: 500 });
    }
  }

  const json = await request.json().catch(() => null);
  if (!json || typeof json !== "object") {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const presign = presignSchema.safeParse(json);
  if (presign.success) {
    const storage = getStorage();
    if (storage.driver !== "s3") {
      return NextResponse.json(
        {
          error: "Presigned upload requires STORAGE_DRIVER=s3 and AWS_S3_BUCKET",
          fallback: "/api/assets",
        },
        { status: 501 },
      );
    }
    const projectId = resolveProjectFromRequest(request);
    if (!projectId) return unauthorized();
    const result = await createPresignedAsset({
      projectId,
      filename: presign.data.filename,
      mime: presign.data.mime,
      bytes: presign.data.bytes,
    });
    return NextResponse.json(result);
  }

  const complete = completeSchema.safeParse(json);
  if (complete.success) {
    try {
      const access = assertAssetAccess(request, complete.data.assetId);
      if ("error" in access) return access.error;
      const result = await completePresignedAsset(complete.data.assetId);
      return NextResponse.json(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Complete failed";
      return NextResponse.json({ error: message }, { status: 400 });
    }
  }

  return NextResponse.json(
    { error: "Use multipart POST for upload or JSON action presign|complete" },
    { status: 400 },
  );
}
