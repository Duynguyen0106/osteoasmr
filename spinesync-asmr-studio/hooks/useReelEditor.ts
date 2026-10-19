"use client";

import { useCallback, useRef, useState } from "react";
import type { CaptionSegment } from "@/lib/contract/job";
import {
  defaultReelEdit,
  type ReelEditState,
  type ReelMarker,
} from "@/lib/contract/reel-edit";
import { importCaptionsForEditor } from "@/lib/reel-edit/captions";
import { clampCaptionRange } from "@/lib/reel-edit/caption-timing";
import { clipDurationSec, normalizeReelEdit } from "@/lib/reel-edit/normalize";

const MAX_UNDO = 24;

export type EditorTool = "select" | "trim" | "peak" | "caption";

export function useReelEditor(options: {
  sourceDurationSec: number;
  initialPeakSec: number;
  captionSegments?: CaptionSegment[] | null;
}) {
  const { sourceDurationSec, initialPeakSec, captionSegments } = options;
  const dur = Math.max(sourceDurationSec, 0.1);

  const [edit, setEditRaw] = useState<ReelEditState>(() => {
    const base = defaultReelEdit(dur);
    const peakClip = Math.max(0, Math.min(initialPeakSec - base.trimInSec, dur));
    return normalizeReelEdit(
      {
        ...base,
        peakTimeSec: peakClip,
        captions: importCaptionsForEditor(captionSegments, base, dur),
      },
      dur,
    );
  });
  const undoRef = useRef<ReelEditState[]>([]);
  const redoRef = useRef<ReelEditState[]>([]);
  const [tool, setTool] = useState<EditorTool>("select");
  const [playheadSec, setPlayheadSec] = useState(0);

  const commit = useCallback(
    (next: ReelEditState) => {
      const normalized = normalizeReelEdit(next, dur);
      setEditRaw((prev) => {
        undoRef.current = [...undoRef.current.slice(-MAX_UNDO + 1), prev];
        redoRef.current = [];
        return normalized;
      });
    },
    [dur],
  );

  const setEdit = useCallback(
    (updater: (prev: ReelEditState) => ReelEditState) => {
      setEditRaw((prev) => {
        const next = normalizeReelEdit(updater(prev), dur);
        return next;
      });
    },
    [dur],
  );

  const undo = useCallback(() => {
    const prev = undoRef.current.pop();
    if (!prev) return;
    setEditRaw((current) => {
      redoRef.current.push(current);
      return prev;
    });
  }, []);

  const redo = useCallback(() => {
    const next = redoRef.current.pop();
    if (!next) return;
    setEditRaw((current) => {
      undoRef.current.push(current);
      return next;
    });
  }, []);

  const setTrimIn = useCallback(
    (t: number) => {
      commit({
        ...edit,
        trimInSec: t,
      });
    },
    [commit, edit],
  );

  const setTrimOut = useCallback(
    (t: number) => {
      commit({
        ...edit,
        trimOutSec: t,
      });
    },
    [commit, edit],
  );

  const setPeak = useCallback(
    (t: number) => {
      commit({
        ...edit,
        peakTimeSec: t,
      });
    },
    [commit, edit],
  );

  const addMarker = useCallback(
    (timeSec: number, label?: string) => {
      const marker: ReelMarker = {
        id: crypto.randomUUID(),
        timeSec,
        label,
        color: "cyan",
      };
      commit({
        ...edit,
        markers: [...edit.markers, marker],
      });
    },
    [commit, edit],
  );

  const setInAtPlayhead = useCallback(() => {
    const out = edit.trimOutSec ?? dur;
    const newIn = edit.trimInSec + playheadSec;
    commit({
      ...edit,
      trimInSec: Math.min(newIn, out - 0.25),
    });
  }, [commit, edit, playheadSec, dur]);

  const setOutAtPlayhead = useCallback(() => {
    commit({
      ...edit,
      trimOutSec: edit.trimInSec + Math.max(0.25, playheadSec),
    });
  }, [commit, edit, playheadSec]);

  const updateCaptionText = useCallback(
    (index: number, text: string) => {
      if (!edit.captions) return;
      const captions = edit.captions.map((c, i) =>
        i === index ? { ...c, text } : c,
      );
      commit({ ...edit, captions });
    },
    [commit, edit],
  );

  const updateCaptionTiming = useCallback(
    (index: number, start: number, end: number) => {
      if (!edit.captions) return;
      const { start: s, end: e } = clampCaptionRange(start, end, dur);
      const captions = edit.captions
        .map((c, i) => (i === index ? { ...c, start: s, end: e } : c))
        .sort((a, b) => a.start - b.start);
      commit({ ...edit, captions });
    },
    [commit, edit, dur],
  );

  const addCaptionAtPlayhead = useCallback(
    (text = "New caption") => {
      const sourceStart = edit.trimInSec + playheadSec;
      const { start, end } = clampCaptionRange(
        sourceStart,
        sourceStart + 1.2,
        dur,
      );
      const segment = { start, end, text };
      const captions = [...(edit.captions ?? []), segment].sort(
        (a, b) => a.start - b.start,
      );
      commit({ ...edit, captions });
    },
    [commit, edit, dur, playheadSec],
  );

  const clipDuration = clipDurationSec(edit);
  const peakDisplay = edit.peakTimeSec ?? initialPeakSec;

  return {
    edit,
    tool,
    setTool,
    playheadSec,
    setPlayheadSec,
    clipDuration,
    peakDisplay,
    setTrimIn,
    setTrimOut,
    setPeak,
    addMarker,
    setInAtPlayhead,
    setOutAtPlayhead,
    updateCaptionText,
    updateCaptionTiming,
    addCaptionAtPlayhead,
    setZoomIntensity: (zoomIntensity: number) =>
      commit({ ...edit, zoomIntensity }),
    undo,
    redo,
    setEdit,
  };
}
