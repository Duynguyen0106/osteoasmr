"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";
import {
  DEFAULT_HASHTAGS,
  buildInstagramCopy,
  buildYoutubeCopy,
} from "@/lib/samples";
import type { JobCopyResult } from "@/lib/contract/job";
import type { CopyTab, SamplePreset } from "@/lib/types";

interface CopywriterTabsProps {
  preset: SamplePreset;
  eqBoost: number;
  copyRevision: number;
  serverCopy?: JobCopyResult | null;
}

const TABS: { id: CopyTab; label: string }[] = [
  { id: "instagram", label: "Instagram / TikTok" },
  { id: "youtube", label: "YouTube Shorts" },
  { id: "hashtags", label: "Hashtags" },
];

export function CopywriterTabs({
  preset,
  eqBoost,
  copyRevision,
  serverCopy,
}: CopywriterTabsProps) {
  const [tab, setTab] = useState<CopyTab>("instagram");
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState<string | null>(null);

  const generatedSuffix =
    copyRevision > 0
      ? `\n\n— GPT-4o run #${copyRevision} · optimized for ${tab === "youtube" ? "Shorts" : "Reels"}`
      : "";

  const baseCopy =
    serverCopy && copyRevision > 0
      ? tab === "instagram"
        ? serverCopy.instagram
        : tab === "youtube"
          ? serverCopy.youtube
          : serverCopy.hashtags
      : tab === "instagram"
        ? buildInstagramCopy(preset, eqBoost)
        : tab === "youtube"
          ? buildYoutubeCopy(preset)
          : DEFAULT_HASHTAGS;

  const copyText = baseCopy + generatedSuffix;

  const handleCopy = async () => {
    setCopyError(null);
    try {
      await navigator.clipboard.writeText(copyText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopyError("Copy failed — check browser permissions or use HTTPS.");
    }
  };

  const tabPanelId = `copy-panel-${tab}`;

  return (
    <div className="glass-panel rounded-2xl p-4">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <h3 className="text-sm font-semibold text-white">GPT-4o Copywriter</h3>
        {copyRevision > 0 && (
          <span className="rounded-full bg-purple-500/20 px-2 py-0.5 text-[10px] font-medium text-purple-200 ring-1 ring-purple-400/30">
            Generated · run #{copyRevision}
          </span>
        )}
      </div>
      <div
        role="tablist"
        aria-label="Copywriter output format"
        className="mb-3 flex flex-wrap gap-1 border-b border-slate-700/60 pb-2"
      >
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            aria-controls={tabPanelId}
            id={`copy-tab-${t.id}`}
            onClick={() => setTab(t.id)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              tab === t.id
                ? "bg-cyan-500/20 text-cyan-200"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <textarea
        readOnly
        id={tabPanelId}
        role="tabpanel"
        aria-labelledby={`copy-tab-${tab}`}
        value={copyText}
        rows={6}
        className="w-full resize-none rounded-lg border border-slate-700/60 bg-black/40 p-3 text-xs leading-relaxed text-slate-300"
      />
      {copyError && (
        <p className="mt-2 text-xs text-red-400" role="alert">
          {copyError}
        </p>
      )}
      <button
        type="button"
        onClick={() => void handleCopy()}
        className="mt-2 flex items-center gap-2 rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-3 py-2 text-xs font-medium text-cyan-200 transition hover:bg-cyan-500/20"
      >
        {copied ? (
          <>
            <Check className="h-3.5 w-3.5" /> Copied!
          </>
        ) : (
          <>
            <Copy className="h-3.5 w-3.5" /> Copy to clipboard
          </>
        )}
      </button>
    </div>
  );
}
