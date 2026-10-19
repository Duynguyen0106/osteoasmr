"use client";

import { Dropzone } from "./Dropzone";
import { SamplePresets } from "./SamplePresets";

interface IngestionPanelProps {
  file: File | null;
  activePresetId: string | null;
  onFileSelect: (file: File | null) => void;
  onPresetSelect: (presetId: string) => void;
  onInvalidFile?: (fileName: string) => void;
}

export function IngestionPanel({
  file,
  activePresetId,
  onFileSelect,
  onPresetSelect,
  onInvalidFile,
}: IngestionPanelProps) {
  return (
    <div className="space-y-3">
      <Dropzone
        file={file}
        onFileSelect={onFileSelect}
        onInvalidFile={onInvalidFile}
      />
      <SamplePresets activePresetId={activePresetId} onSelect={onPresetSelect} />
    </div>
  );
}
