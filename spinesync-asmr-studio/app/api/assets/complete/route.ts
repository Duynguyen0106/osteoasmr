import { NextResponse } from "next/server";
import { z } from "zod";
import { assertAssetAccess } from "@/lib/server/access";
import { completePresignedAsset } from "@/lib/server/assets";

const bodySchema = z.object({
  assetId: z.string().min(1),
});

export async function POST(request: Request) {
  const json = await request.json();
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid complete payload" }, { status: 400 });
  }

  try {
    const access = assertAssetAccess(request, parsed.data.assetId);
    if ("error" in access) return access.error;

    const result = await completePresignedAsset(parsed.data.assetId);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Complete failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
