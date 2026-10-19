"use client";

import { useEffect, useState } from "react";
import {
  analyzeAudioBuffer,
  type AudioPeakProfile,
} from "@/lib/client-audio-peaks";
import { PEAK_TIME_SEC } from "@/lib/waveform";

export function emptyAudioProfile(): AudioPeakProfile {
  return {
    durationSec: 0,
    peakTimeSec: PEAK_TIME_SEC,
    peakDb: -12,
    envelope: [],
  };
}

export function useSourceAudioProfile(file: File | null) {
  const [profile, setProfile] = useState<AudioPeakProfile>(emptyAudioProfile);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!file) return;
    const sourceFile = file;

    let cancelled = false;

    async function run() {
      setLoading(true);
      setError(null);
      try {
        const buffer = await sourceFile.arrayBuffer();
        if (cancelled) return;

        const ctx = new AudioContext();
        try {
          const decoded = await ctx.decodeAudioData(buffer.slice(0));
          if (cancelled) return;
          setProfile(analyzeAudioBuffer(decoded));
        } finally {
          await ctx.close();
        }
      } catch {
        if (!cancelled) {
          setError("Could not decode audio — using simulated waveform");
          setProfile(emptyAudioProfile());
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void run();
    return () => {
      cancelled = true;
    };
  }, [file]);

  if (!file) {
    return { profile: emptyAudioProfile(), loading: false, error: null };
  }

  return { profile, loading, error };
}
