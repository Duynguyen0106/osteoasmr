import { NextResponse } from "next/server";
import { previewBodySchema } from "@/lib/contract/preview-reel";
import { assertAssetAccess } from "@/lib/server/access";
import { buildIncrementalReelPreview } from "@/lib/server/incremental-preview";
import { buildIncrementalThumbPreview } from "@/lib/server/incremental-thumb";

export async function POST(request: Request) {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = previewBodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const access = assertAssetAccess(request, parsed.data.assetId);
  if ("error" in access) return access.error;

  const { kind, ...body } = parsed.data;

  try {
    if (kind === "thumb") {
      const headline = body.headline?.trim() || "SPINESYNC ASMR";
      const result = await buildIncrementalThumbPreview(
        body,
        access.asset,
        headline,
      );
      return NextResponse.json(result);
    }
    const result = await buildIncrementalReelPreview(body, access.asset);
    return NextResponse.json(result);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Incremental preview failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
