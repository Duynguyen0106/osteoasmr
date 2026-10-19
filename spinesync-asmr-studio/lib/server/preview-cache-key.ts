import { createHash } from "crypto";
import type { PreviewReelBody } from "@/lib/contract/preview-reel";

export function incrementalPreviewCacheId(body: PreviewReelBody): string {
  const payload = JSON.stringify({
    v: 1,
    assetId: body.assetId,
    edit: body.edit ?? null,
    autoPeakZoom: body.autoPeakZoom,
    zoomIntensity: body.zoomIntensity ?? null,
  });
  return createHash("sha256").update(payload).digest("hex").slice(0, 24);
}
