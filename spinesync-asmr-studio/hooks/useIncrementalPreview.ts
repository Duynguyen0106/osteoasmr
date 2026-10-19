"use client";

import { useCallback, useState } from "react";
import type { ReelEditState } from "@/lib/contract/reel-edit";
import { spinesyncFetch } from "@/lib/api-client";
import { defaultReelEdit } from "@/lib/contract/reel-edit";
import { normalizeReelEdit } from "@/lib/reel-edit/normalize";

export function useIncrementalPreview(options: {
  assetId: string | null;
  enabled: boolean;
  sourceDurationSec: number;
  reelEdit: ReelEditState | null;
  autoPeakZoom: boolean;
  onLog: (message: string) => void;
}) {
  const { assetId, enabled, sourceDurationSec, reelEdit, autoPeakZoom, onLog } =
    options;
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearPreview = useCallback(() => {
    setPreviewUrl(null);
    setError(null);
  }, []);

  const bakePreview = useCallback(async () => {
    if (!enabled || !assetId) {
      setError("Upload media in server mode first");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const edit = normalizeReelEdit(
        reelEdit ?? defaultReelEdit(sourceDurationSec),
        sourceDurationSec,
      );
      const res = await spinesyncFetch("/api/preview/reel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assetId,
          edit,
          autoPeakZoom,
          zoomIntensity: edit.zoomIntensity,
        }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as {
          error?: string | Record<string, unknown>;
        };
        const message =
          typeof data.error === "string"
            ? data.error
            : "Preview request failed";
        throw new Error(message);
      }
      const data = (await res.json()) as {
        previewUrl: string;
        cached: boolean;
        durationSec: number;
      };
      setPreviewUrl(data.previewUrl);
      onLog(
        `Quick ffmpeg preview · ${data.cached ? "cache hit" : "baked"} · ${data.durationSec.toFixed(1)}s clip`,
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : "Preview failed";
      setError(message);
      onLog(`Quick preview · ${message}`);
    } finally {
      setLoading(false);
    }
  }, [
    assetId,
    autoPeakZoom,
    enabled,
    onLog,
    reelEdit,
    sourceDurationSec,
  ]);

  return { previewUrl, loading, error, bakePreview, clearPreview };
}
