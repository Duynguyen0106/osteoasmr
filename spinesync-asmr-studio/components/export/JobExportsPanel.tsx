"use client";

import { Download, FileJson, Film, ImageIcon, Music2 } from "lucide-react";
import type { JobResult } from "@/lib/contract/job";

interface JobExportsPanelProps {
  jobResult: JobResult | null;
  pipelineComplete: boolean;
}

function downloadLink(href: string, label: string) {
  return (
    <a
      href={href}
      download
      className="flex items-center gap-2 rounded-lg border border-cyan-500/20 bg-cyan-500/5 px-3 py-2 text-xs text-cyan-100 transition hover:border-cyan-400/40 hover:bg-cyan-500/10"
    >
      <Download className="h-3.5 w-3.5 shrink-0" aria-hidden />
      {label}
    </a>
  );
}

export function JobExportsPanel({
  jobResult,
  pipelineComplete,
}: JobExportsPanelProps) {
  if (!pipelineComplete || !jobResult?.previewUrls) return null;

  const { reel, thumb, captions, karaoke, audioEq } = jobResult.previewUrls;

  return (
    <div className="glass-panel rounded-2xl p-4">
      <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
        <Film className="h-4 w-4 text-cyan-400" aria-hidden />
        Export assets
      </h3>
      <div className="grid gap-2 sm:grid-cols-2">
        {reel && downloadLink(reel, "Reel MP4 (9:16)")}
        {audioEq && downloadLink(audioEq, "ASMR audio stem (EQ wav)")}
        {thumb && downloadLink(thumb, "Peak thumbnail")}
        {captions && downloadLink(captions, "Captions VTT")}
        {audioEq && (
          <span className="flex items-center gap-2 px-1 text-[10px] text-slate-500 sm:col-span-2">
            <Music2 className="h-3 w-3" aria-hidden />
            Stem includes multiband EQ, optional crack/room, {jobResult.asmrProfile?.targetLufs ?? -14} LUFS normalize.
          </span>
        )}
        {karaoke && (
          <a
            href={karaoke}
            download
            className="flex items-center gap-2 rounded-lg border border-purple-500/20 bg-purple-500/5 px-3 py-2 text-xs text-purple-100 transition hover:border-purple-400/40"
          >
            <FileJson className="h-3.5 w-3.5 shrink-0" aria-hidden />
            Karaoke segments JSON
          </a>
        )}
        {thumb && (
          <span className="flex items-center gap-2 px-1 text-[10px] text-slate-500 sm:col-span-2">
            <ImageIcon className="h-3 w-3" aria-hidden />
            Signed URLs expire — download soon or re-run pipeline to refresh links.
          </span>
        )}
      </div>
    </div>
  );
}
