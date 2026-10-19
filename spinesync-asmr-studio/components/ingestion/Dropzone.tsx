"use client";

import { Upload, Video } from "lucide-react";
import { useCallback, useRef, useState } from "react";

interface DropzoneProps {
  file: File | null;
  onFileSelect: (file: File | null) => void;
}

export function Dropzone({ file, onFileSelect }: DropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFiles = useCallback(
    (files: FileList | null) => {
      const f = files?.[0];
      if (!f) return;
      const ok =
        f.type === "video/mp4" ||
        f.type === "video/quicktime" ||
        f.name.match(/\.(mp4|mov)$/i);
      if (ok) onFileSelect(f);
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
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
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
            : "border-cyan-500/25 hover:border-cyan-400/50 hover:bg-white/[0.02]"
        }`}
      >
        <Upload className="mx-auto mb-2 h-8 w-8 text-cyan-400/70" />
        <p className="text-sm text-slate-300">
          Drop MP4 / MOV or click to browse
        </p>
        {file && (
          <p className="mt-2 font-mono text-xs text-cyan-300">
            {file.name} · {(file.size / 1024 / 1024).toFixed(1)} MB
          </p>
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
