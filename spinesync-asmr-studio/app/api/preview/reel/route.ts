import { NextResponse } from "next/server";
import { previewReelBodySchema } from "@/lib/contract/preview-reel";
import { assertAssetAccess } from "@/lib/server/access";
import { buildIncrementalReelPreview } from "@/lib/server/incremental-preview";

export async function POST(request: Request) {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = previewReelBodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const access = assertAssetAccess(request, parsed.data.assetId);
  if ("error" in access) return access.error;

  try {
    const result = await buildIncrementalReelPreview(parsed.data, access.asset);
    return NextResponse.json(result);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Incremental preview failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
