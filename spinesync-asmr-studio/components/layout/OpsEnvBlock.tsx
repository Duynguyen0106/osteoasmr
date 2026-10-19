"use client";

import type { ReactNode } from "react";

interface OpsEnvBlockProps {
  title: string;
  icon: ReactNode;
  description: ReactNode;
  envLines: readonly string[];
  borderClass?: string;
  titleClass?: string;
}

export function OpsEnvBlock({
  title,
  icon,
  description,
  envLines,
  borderClass = "border-slate-600/40 bg-slate-900/40",
  titleClass = "text-slate-100",
}: OpsEnvBlockProps) {
  const copyBlock = envLines.join("\n");

  return (
    <div className={`rounded-xl border p-3 space-y-2 ${borderClass}`}>
      <div className={`flex items-center gap-2 text-xs font-semibold ${titleClass}`}>
        {icon}
        {title}
      </div>
      <div className="text-[11px] text-slate-400 leading-relaxed">{description}</div>
      <pre className="overflow-x-auto rounded-lg bg-slate-950/80 p-2 font-mono text-[10px] text-slate-200/90">
        {copyBlock}
      </pre>
      <button
        type="button"
        className="rounded-lg border border-slate-500/40 bg-slate-800/50 px-2 py-1 text-[11px] text-slate-200 hover:bg-slate-700/50"
        onClick={() => void navigator.clipboard.writeText(copyBlock)}
      >
        Copy env block
      </button>
    </div>
  );
}
