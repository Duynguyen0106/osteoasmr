import { NextResponse } from "next/server";
import { assertAssetAccess } from "@/lib/server/access";
import { materializeAssetLocalPath } from "@/lib/server/assets";
import { detectPeakTimeSec, probeDurationSec } from "@/lib/server/ffmpeg";
export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const access = assertAssetAccess(request, id);
  if ("error" in access) return access.error;

  const asset = access.asset;

  try {
    const localPath = await materializeAssetLocalPath({
      storagePath: asset.storagePath,
      storageKey: asset.storageKey,
      storageDriver: asset.storageDriver,
    });
    const durationSec = (await probeDurationSec(localPath)) ?? 0;
    const peakTimeSec = await detectPeakTimeSec(localPath, 4.2);

    return NextResponse.json({
      assetId: id,
      durationSec,
      peakTimeSec,
      source: "ffmpeg",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Analyze failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
