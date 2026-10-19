"use client";

import {
  Captions,
  Film,
  MousePointer2,
  Redo2,
  Scissors,
  Sparkles,
  Undo2,
  Zap,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { CaptionSegment } from "@/lib/contract/job";
import type { ReelEditState } from "@/lib/contract/reel-edit";
import { TimelineMultiTrack } from "@/components/editor/TimelineMultiTrack";
import { useReelEditor, type EditorTool } from "@/hooks/useReelEditor";

const TOOLS: { id: EditorTool; label: string; icon: typeof MousePointer2 }[] = [
  { id: "select", label: "Select", icon: MousePointer2 },
  { id: "trim", label: "Trim", icon: Scissors },
  { id: "peak", label: "Peak", icon: Zap },
  { id: "caption", label: "Caption", icon: Captions },
  { id: "broll", label: "B-roll", icon: Film },
];

interface ReelProEditorProps {
  sourceDurationSec: number;
  peakTimeSec: number;
  captionSegments?: CaptionSegment[] | null;
  audioEnvelope?: number[] | null;
  initialEdit?: ReelEditState | null;
  durationSourceLabel?: string;
  durationMismatch?: boolean;
  durationMismatchDetail?: string;
  exportsEditsToPipeline?: boolean;
  onQuickPreview?: () => void;
  quickPreviewLoading?: boolean;
  quickPreviewError?: string | null;
  onBrollUpload?: (
    file: File,
  ) => Promise<{ assetId: string; label: string } | null>;
  onBrollLog?: (message: string) => void;
  onEditChange?: (edit: ReturnType<typeof useReelEditor>["edit"]) => void;
  onSeekPreview?: (clipTimeSec: number) => void;
}

export function ReelProEditor({
  sourceDurationSec,
  peakTimeSec,
  captionSegments,
  audioEnvelope,
  initialEdit,
  durationSourceLabel,
  durationMismatch,
  durationMismatchDetail,
  exportsEditsToPipeline = true,
  onQuickPreview,
  quickPreviewLoading = false,
  quickPreviewError = null,
  onBrollUpload,
  onBrollLog,
  onEditChange,
  onSeekPreview,
}: ReelProEditorProps) {
  const editor = useReelEditor({
    sourceDurationSec,
    initialPeakSec: Math.max(0, peakTimeSec),
    captionSegments,
    initialEdit,
  });
  const [captionIndex, setCaptionIndex] = useState(0);
  const [brollIndex, setBrollIndex] = useState(0);
  const brollInputRef = useRef<HTMLInputElement>(null);
  const [brollUploading, setBrollUploading] = useState(false);

  const handleBrollFile = useCallback(
    async (file: File | null) => {
      if (!file || !onBrollUpload) return;
      setBrollUploading(true);
      try {
        const result = await onBrollUpload(file);
        if (result) {
          editor.addBrollOverlay(result.assetId, result.label);
          onBrollLog?.(`B-roll ingested · ${result.label}`);
        }
      } catch (err) {
        onBrollLog?.(
          `B-roll upload failed: ${err instanceof Error ? err.message : "unknown"}`,
        );
      } finally {
        setBrollUploading(false);
        if (brollInputRef.current) brollInputRef.current.value = "";
      }
    },
    [editor, onBrollLog, onBrollUpload],
  );

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
            {exportsEditsToPipeline
              ? "Trim · peak · captions · zoom — baked into the next pipeline export"
              : "Trim · peak · captions · zoom — preview only until server pipeline mode is enabled"}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-1">
          {exportsEditsToPipeline && onQuickPreview && (
            <button
              type="button"
              disabled={quickPreviewLoading}
              className="rounded-lg border border-cyan-500/40 bg-cyan-500/10 px-2 py-1 text-[10px] font-semibold text-cyan-100 hover:bg-cyan-500/20 disabled:opacity-50"
              onClick={() => onQuickPreview()}
            >
              {quickPreviewLoading ? "Baking preview…" : "Quick ffmpeg preview"}
            </button>
          )}
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
        {quickPreviewError && (
          <p className="text-[10px] text-amber-200/90">{quickPreviewError}</p>
        )}
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
        durationSourceLabel={durationSourceLabel}
        durationMismatch={durationMismatch}
        durationMismatchDetail={durationMismatchDetail}
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
        selectedCaptionIndex={captionIndex}
        onCaptionTimingChange={editor.updateCaptionTiming}
        brollOverlays={editor.edit.brollOverlays}
        selectedBrollIndex={brollIndex}
        onSelectBroll={setBrollIndex}
        onBrollTimingChange={editor.updateBrollTiming}
        onRemoveBroll={editor.removeBrollOverlay}
      />

      {editor.tool === "caption" && (
        <button
          type="button"
          className="rounded-lg border border-purple-500/40 bg-purple-500/10 px-3 py-1.5 text-[11px] text-purple-100 hover:bg-purple-500/20"
          onClick={() => editor.addCaptionAtPlayhead()}
        >
          Add caption at playhead ({editor.playheadSec.toFixed(1)}s on clip)
        </button>
      )}

      {editor.tool === "broll" && (
        <div className="flex flex-wrap items-center gap-2">
          <input
            ref={brollInputRef}
            type="file"
            accept="video/*"
            className="hidden"
            onChange={(e) => void handleBrollFile(e.target.files?.[0] ?? null)}
          />
          <button
            type="button"
            disabled={!onBrollUpload || brollUploading}
            className="rounded-lg border border-teal-500/40 bg-teal-500/10 px-3 py-1.5 text-[11px] text-teal-100 hover:bg-teal-500/20 disabled:opacity-40"
            onClick={() => brollInputRef.current?.click()}
          >
            {brollUploading
              ? "Uploading B-roll…"
              : `Add B-roll at playhead (${editor.playheadSec.toFixed(1)}s on clip)`}
          </button>
          {!onBrollUpload && (
            <span className="text-[10px] text-amber-200/90">
              B-roll upload requires server pipeline mode.
            </span>
          )}
        </div>
      )}

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
        {editor.tool === "caption" ? (
          <label className="block text-[11px] text-slate-400">
            Caption text
            {captions?.length ? (
              <textarea
                value={captions[captionIndex]?.text ?? ""}
                onChange={(e) =>
                  editor.updateCaptionText(captionIndex, e.target.value)
                }
                rows={2}
                className="mt-1 w-full rounded-lg border border-slate-600/50 bg-slate-950/60 px-2 py-1 text-[11px] text-slate-200"
              />
            ) : (
              <span className="mt-1 block text-[10px] text-slate-500">
                No captions yet — add at playhead or run Whisper in pipeline
              </span>
            )}
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
