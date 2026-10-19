"use client";

import { Upload, Video, X } from "lucide-react";
import { useCallback, useRef, useState } from "react";

interface DropzoneProps {
  file: File | null;
  onFileSelect: (file: File | null) => void;
  onInvalidFile?: (fileName: string) => void;
}

function isAcceptedVideo(file: File): boolean {
  return (
    file.type === "video/mp4" ||
    file.type === "video/quicktime" ||
    Boolean(file.name.match(/\.(mp4|mov)$/i))
  );
}

export function Dropzone({
  file,
  onFileSelect,
  onInvalidFile,
}: DropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [inlineError, setInlineError] = useState<string | null>(null);

  const handleFiles = useCallback(
    (files: FileList | null) => {
      const f = files?.[0];
      if (!f) return;
      if (!isAcceptedVideo(f)) {
        setInlineError("Only MP4 and MOV files are supported.");
        onInvalidFile?.(f.name);
        return;
      }
      setInlineError(null);
      onFileSelect(f);
    },
    [onFileSelect, onInvalidFile],
  );

  const clearFile = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      setInlineError(null);
      onFileSelect(null);
      if (inputRef.current) inputRef.current.value = "";
    },
    [onFileSelect],
  );

  return (
    <div className="glass-panel rounded-2xl p-4">
      <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
        <Video className="h-4 w-4 text-cyan-400" />
        Media Ingestion
      </h3>
      <div
        role="button"
        tabIndex={0}
        aria-label="Upload MP4 or MOV video"
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          handleFiles(e.dataTransfer.files);
        }}
        className={`cursor-pointer rounded-xl border-2 border-dashed px-4 py-8 text-center transition-colors ${
          dragOver
            ? "border-cyan-400 bg-cyan-500/10"
            : inlineError
              ? "border-red-500/40 bg-red-500/5"
              : "border-cyan-500/25 hover:border-cyan-400/50 hover:bg-white/[0.02]"
        }`}
      >
        <Upload className="mx-auto mb-2 h-8 w-8 text-cyan-400/70" />
        <p className="text-sm text-slate-300">
          Drop MP4 / MOV or click to browse
        </p>
        {inlineError && (
          <p className="mt-2 text-xs text-red-400" role="alert">
            {inlineError}
          </p>
        )}
        {file && (
          <div className="mt-2 flex items-center justify-center gap-2">
            <p className="font-mono text-xs text-cyan-300">
              {file.name} · {(file.size / 1024 / 1024).toFixed(1)} MB
            </p>
            <button
              type="button"
              onClick={clearFile}
              aria-label="Remove uploaded video"
              className="rounded-md border border-slate-600 p-1 text-slate-400 hover:border-red-500/50 hover:text-red-300"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="video/mp4,video/quicktime,.mp4,.mov"
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
    </div>
  );
}
