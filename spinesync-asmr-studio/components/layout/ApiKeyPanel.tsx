"use client";

import { KeyRound } from "lucide-react";
import { useCallback, useState } from "react";
import {
  ensureStudioSession,
  getStoredApiKey,
  setStoredApiKey,
} from "@/lib/api-client";

interface ApiKeyPanelProps {
  requireApiKey: boolean;
  visible: boolean;
}

export function ApiKeyPanel({ requireApiKey, visible }: ApiKeyPanelProps) {
  const [value, setValue] = useState("");
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasKey = Boolean(getStoredApiKey());

  const save = useCallback(async () => {
    setError(null);
    setSaved(false);
    const trimmed = value.trim();
    if (!trimmed) {
      setError("Enter your project API key");
      return;
    }
    setStoredApiKey(trimmed);
    try {
      const res = await fetch("/api/auth/bootstrap", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "x-spinesync-api-key": trimmed,
        },
        body: JSON.stringify({ apiKey: trimmed }),
      });
      if (!res.ok) {
        setError("Invalid API key — check Vercel env or local .env");
        return;
      }
      await ensureStudioSession();
      setSaved(true);
      setValue("");
    } catch {
      setError("Bootstrap failed");
    }
  }, [value]);

  if (!visible) return null;

  return (
    <div className="glass-panel rounded-2xl p-4">
      <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-white">
        <KeyRound className="h-4 w-4 text-cyan-400" aria-hidden />
        Studio API key
      </h3>
      <p className="mb-2 text-[11px] text-slate-400">
        {requireApiKey
          ? "Production requires an API key for uploads and jobs. Stored in sessionStorage for this tab."
          : "Optional in dev — use if you run SPINESYNC_REQUIRE_API_KEY."}
        {hasKey && (
          <span className="ml-1 text-emerald-400">Key saved in this session.</span>
        )}
      </p>
      <div className="flex gap-2">
        <input
          type="password"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="sk_…"
          className="flex-1 rounded-lg border border-slate-600/50 bg-slate-950/60 px-2 py-1.5 text-[11px] text-slate-200"
          aria-label="SpineSync API key"
        />
        <button
          type="button"
          onClick={() => void save()}
          className="rounded-lg bg-cyan-600/80 px-3 py-1.5 text-[11px] font-semibold text-white"
        >
          Save & connect
        </button>
      </div>
      {error && (
        <p className="mt-2 text-[10px] text-red-400" role="alert">
          {error}
        </p>
      )}
      {saved && (
        <p className="mt-2 text-[10px] text-emerald-400">Session connected.</p>
      )}
    </div>
  );
}
