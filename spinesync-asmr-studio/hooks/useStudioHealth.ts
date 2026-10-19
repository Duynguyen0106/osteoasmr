"use client";

import { useEffect, useState } from "react";
import { spinesyncFetch } from "@/lib/api-client";

export interface StudioHealth {
  ffmpeg: boolean;
  pipelineBlockers?: string[];
  ffmpegDetail?: { error?: string | null };
  hosting?: {
    vercel?: boolean;
    serverless?: boolean;
    maxFunctionDurationSec?: number | null;
    ephemeralData?: boolean;
    durableStorage?: boolean;
    pipelineReady?: boolean;
  };
  storage?: { driver?: string; presign?: boolean };
  integrations?: {
    openai?: boolean;
    ayrshare?: boolean;
    canPublishAyrshare?: boolean;
    appBaseUrl?: string;
  };
  auth?: { requireApiKey?: boolean; apiKeyConfigured?: boolean };
  queue?: { executor?: string; backend?: string; redisLive?: boolean };
  remotion?: { mode?: string; requested?: string; lambdaDeployed?: boolean };
}

export function useStudioHealth(enabled: boolean) {
  const [health, setHealth] = useState<StudioHealth | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) {
      return;
    }
    let cancelled = false;
    spinesyncFetch("/api/health")
      .then(async (res) => {
        if (!res.ok) throw new Error("Health check failed");
        return (await res.json()) as StudioHealth;
      })
      .then((data) => {
        if (!cancelled) {
          setHealth(data);
          setError(null);
        }
      })
      .catch(() => {
        if (!cancelled) setError("Could not reach /api/health");
      });
    return () => {
      cancelled = true;
    };
  }, [enabled]);

  return {
    health: enabled ? health : null,
    error: enabled ? error : null,
  };
}
