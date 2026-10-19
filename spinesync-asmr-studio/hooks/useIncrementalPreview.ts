"use client";

import { useCallback, useState } from "react";
import type { ReelEditState } from "@/lib/contract/reel-edit";
import { spinesyncFetch } from "@/lib/api-client";
import { defaultReelEdit } from "@/lib/contract/reel-edit";
import { normalizeReelEdit } from "@/lib/reel-edit/normalize";

async function parsePreviewError(res: Response): Promise<string> {
  const data = (await res.json().catch(() => ({}))) as {
    error?: string | Record<string, unknown>;
  };
  if (typeof data.error === "string") return data.error;
  return "Request failed";
}

export function useIncrementalPreview(options: {
  assetId: string | null;
  enabled: boolean;
  sourceDurationSec: number;
  reelEdit: ReelEditState | null;
  autoPeakZoom: boolean;
  headline: string;
  onLog: (message: string) => void;
}) {
  const {
    assetId,
    enabled,
    sourceDurationSec,
    reelEdit,
    autoPeakZoom,
    headline,
    onLog,
  } = options;
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [thumbPreviewUrl, setThumbPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [thumbLoading, setThumbLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [thumbError, setThumbError] = useState<string | null>(null);

  const clearPreview = useCallback(() => {
    setPreviewUrl(null);
    setThumbPreviewUrl(null);
    setError(null);
    setThumbError(null);
  }, []);

  const previewBody = useCallback(() => {
    const edit = normalizeReelEdit(
      reelEdit ?? defaultReelEdit(sourceDurationSec),
      sourceDurationSec,
    );
    return {
      assetId: assetId!,
      edit,
      autoPeakZoom,
      zoomIntensity: edit.zoomIntensity,
    };
  }, [assetId, autoPeakZoom, reelEdit, sourceDurationSec]);

  const bakePreview = useCallback(async () => {
    if (!enabled || !assetId) {
      setError("Upload media in server mode first");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await spinesyncFetch("/api/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...previewBody(), kind: "reel" }),
      });
      if (!res.ok) throw new Error(await parsePreviewError(res));
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
  }, [assetId, enabled, onLog, previewBody]);

  const bakeThumb = useCallback(async () => {
    if (!enabled || !assetId) {
      setThumbError("Upload media in server mode first");
      return;
    }
    setThumbLoading(true);
    setThumbError(null);
    try {
      const res = await spinesyncFetch("/api/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...previewBody(),
          kind: "thumb",
          headline: headline.trim() || "SPINESYNC ASMR",
        }),
      });
      if (!res.ok) throw new Error(await parsePreviewError(res));
      const data = (await res.json()) as {
        previewUrl: string;
        cached: boolean;
        seekSec: number;
      };
      setThumbPreviewUrl(data.previewUrl);
      onLog(
        `Quick thumbnail · ${data.cached ? "cache hit" : "baked"} · frame @ ${data.seekSec.toFixed(1)}s on clip`,
      );
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Thumbnail preview failed";
      setThumbError(message);
      onLog(`Quick thumbnail · ${message}`);
    } finally {
      setThumbLoading(false);
    }
  }, [assetId, enabled, headline, onLog, previewBody]);

  return {
    previewUrl,
    thumbPreviewUrl,
    loading,
    thumbLoading,
    error,
    thumbError,
    bakePreview,
    bakeThumb,
    clearPreview,
  };
}
