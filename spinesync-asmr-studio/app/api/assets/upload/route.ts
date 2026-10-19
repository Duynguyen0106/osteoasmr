import { NextResponse } from "next/server";
import { resolveProjectId } from "@/lib/server/auth";
import { saveUploadedAsset } from "@/lib/server/assets";

const MAX_BYTES = 500 * 1024 * 1024;

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Missing file field" }, { status: 400 });
    }

    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: "File exceeds 500MB limit" }, { status: 413 });
    }

    const ok =
      file.type === "video/mp4" ||
      file.type === "video/quicktime" ||
      /\.(mp4|mov)$/i.test(file.name);
    if (!ok) {
      return NextResponse.json({ error: "Only MP4/MOV allowed" }, { status: 415 });
    }

    const projectId = resolveProjectId(request);
    const asset = await saveUploadedAsset(file, projectId);
    return NextResponse.json(asset);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Upload failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
