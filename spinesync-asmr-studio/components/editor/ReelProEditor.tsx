"use client";

import {
  Captions,
  MousePointer2,
  Redo2,
  Scissors,
  Sparkles,
  Undo2,
  Zap,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import type { CaptionSegment } from "@/lib/contract/job";
import { TimelineMultiTrack } from "@/components/editor/TimelineMultiTrack";
import { useReelEditor, type EditorTool } from "@/hooks/useReelEditor";

const TOOLS: { id: EditorTool; label: string; icon: typeof MousePointer2 }[] = [
  { id: "select", label: "Select", icon: MousePointer2 },
  { id: "trim", label: "Trim", icon: Scissors },
  { id: "peak", label: "Peak", icon: Zap },
  { id: "caption", label: "Caption", icon: Captions },
];

interface ReelProEditorProps {
  sourceDurationSec: number;
  peakTimeSec: number;
  captionSegments?: CaptionSegment[] | null;
  audioEnvelope?: number[] | null;
  onEditChange?: (edit: ReturnType<typeof useReelEditor>["edit"]) => void;
  onSeekPreview?: (clipTimeSec: number) => void;
}

export function ReelProEditor({
  sourceDurationSec,
  peakTimeSec,
  captionSegments,
  audioEnvelope,
  onEditChange,
  onSeekPreview,
}: ReelProEditorProps) {
  const editor = useReelEditor({
    sourceDurationSec,
    initialPeakSec: Math.max(0, peakTimeSec),
    captionSegments,
  });
  const [captionIndex, setCaptionIndex] = useState(0);

  useEffect(() => {
    onEditChange?.(editor.edit);
  }, [editor.edit, onEditChange]);

  const onKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (e.code === "Space") {
        e.preventDefault();
      }
      if (e.key === "i" || e.key === "I") editor.setInAtPlayhead();
      if (e.key === "o" || e.key === "O") editor.setOutAtPlayhead();
      if (e.key === "m" || e.key === "M") editor.addMarker(editor.playheadSec, "Marker");
      if ((e.metaKey || e.ctrlKey) && e.key === "z") {
        e.preventDefault();
        if (e.shiftKey) editor.redo();
        else editor.undo();
      }
      if (e.key === "j") {
        editor.setPlayheadSec(Math.max(0, editor.playheadSec - 0.5));
        onSeekPreview?.(editor.playheadSec);
      }
      if (e.key === "l") {
        editor.setPlayheadSec(
          Math.min(editor.clipDuration, editor.playheadSec + 0.5),
        );
        onSeekPreview?.(editor.playheadSec);
      }
    },
    [editor, onSeekPreview],
  );

  useEffect(() => {
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onKeyDown]);

  const captions = editor.edit.captions ?? captionSegments;

  return (
    <div className="glass-panel space-y-3 rounded-2xl p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="flex items-center gap-2 text-sm font-semibold text-white">
            <Sparkles className="h-4 w-4 text-fuchsia-400" aria-hidden />
            SpineSync Reel Pro Editor
          </h2>
          <p className="text-[11px] text-slate-400">
            Trim · peak · captions · zoom — baked into the next pipeline export
          </p>
        </div>
        <div className="flex gap-1">
          <button
            type="button"
            className="rounded-lg border border-slate-600/50 p-1.5 text-slate-300 hover:bg-slate-800"
            onClick={editor.undo}
            aria-label="Undo"
          >
            <Undo2 className="h-4 w-4" />
          </button>
          <button
            type="button"
            className="rounded-lg border border-slate-600/50 p-1.5 text-slate-300 hover:bg-slate-800"
            onClick={editor.redo}
            aria-label="Redo"
          >
            <Redo2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-1">
        {TOOLS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => editor.setTool(id)}
            className={`flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] ${
              editor.tool === id
                ? "bg-fuchsia-500/25 text-fuchsia-100 ring-1 ring-fuchsia-400/40"
                : "bg-slate-800/60 text-slate-400 hover:text-slate-200"
            }`}
          >
            <Icon className="h-3.5 w-3.5" aria-hidden />
            {label}
          </button>
        ))}
      </div>

      <TimelineMultiTrack
        sourceDurationSec={sourceDurationSec}
        edit={editor.edit}
        playheadSec={editor.playheadSec}
        peakSec={editor.peakDisplay}
        tool={editor.tool}
        envelope={audioEnvelope ?? null}
        captions={captions}
        onSeekClip={(t) => {
          editor.setPlayheadSec(t);
          onSeekPreview?.(t);
        }}
        onTrimInChange={editor.setTrimIn}
        onTrimOutChange={editor.setTrimOut}
        onPeakChange={editor.setPeak}
        onSelectCaption={setCaptionIndex}
      />

      <div className="grid gap-3 md:grid-cols-2">
        <label className="block text-[11px] text-slate-400">
          Peak zoom intensity
          <input
            type="range"
            min={0}
            max={100}
            value={editor.edit.zoomIntensity}
            onChange={(e) => editor.setZoomIntensity(Number(e.target.value))}
            className="mt-1 w-full"
          />
        </label>
        {editor.tool === "caption" && captions?.length ? (
          <label className="block text-[11px] text-slate-400">
            Caption text
            <textarea
              value={captions[captionIndex]?.text ?? ""}
              onChange={(e) => editor.updateCaptionText(captionIndex, e.target.value)}
              rows={2}
              className="mt-1 w-full rounded-lg border border-slate-600/50 bg-slate-950/60 px-2 py-1 text-[11px] text-slate-200"
            />
          </label>
        ) : (
          <p className="text-[10px] text-slate-500 self-end">
            Shortcuts: I/O in-out · M marker · J/L step · ⌘Z undo
          </p>
        )}
      </div>
    </div>
  );
}
