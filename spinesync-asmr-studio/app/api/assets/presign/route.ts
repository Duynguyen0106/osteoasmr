import { NextResponse } from "next/server";
import { z } from "zod";
import { resolveProjectFromRequest, unauthorized } from "@/lib/server/access";
import { createPresignedAsset } from "@/lib/server/assets";
import { getStorage } from "@/lib/server/storage";

const bodySchema = z.object({
  filename: z.string().min(1),
  mime: z.string().min(1),
  bytes: z.number().int().positive().max(500 * 1024 * 1024),
});

export async function POST(request: Request) {
  const storage = getStorage();
  if (storage.driver !== "s3") {
    return NextResponse.json(
      {
        error: "Presigned upload requires STORAGE_DRIVER=s3 and AWS_S3_BUCKET",
        fallback: "/api/assets/upload",
      },
      { status: 501 },
    );
  }

  const json = await request.json();
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid presign payload" }, { status: 400 });
  }

  const projectId = resolveProjectFromRequest(request);
  if (!projectId) return unauthorized();
  const presign = await createPresignedAsset({
    projectId,
    ...parsed.data,
  });

  return NextResponse.json(presign);
}
