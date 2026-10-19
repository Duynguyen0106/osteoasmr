"use client";

import { useCallback, useRef, useState } from "react";
import type { CaptionSegment } from "@/lib/contract/job";
import {
  defaultReelEdit,
  type BrollOverlay,
  type ReelEditState,
  type ReelMarker,
} from "@/lib/contract/reel-edit";
import { clampBrollRange } from "@/lib/reel-edit/broll";
import { importCaptionsForEditor } from "@/lib/reel-edit/captions";
import { clampCaptionRange } from "@/lib/reel-edit/caption-timing";
import { clipDurationSec, normalizeReelEdit } from "@/lib/reel-edit/normalize";

const MAX_UNDO = 24;

export type EditorTool = "select" | "trim" | "peak" | "caption" | "broll";

export function useReelEditor(options: {
  sourceDurationSec: number;
  initialPeakSec: number;
  captionSegments?: CaptionSegment[] | null;
  initialEdit?: ReelEditState | null;
}) {
  const { sourceDurationSec, initialPeakSec, captionSegments, initialEdit } =
    options;
  const dur = Math.max(sourceDurationSec, 0.1);

  const [edit, setEditRaw] = useState<ReelEditState>(() => {
    if (initialEdit) {
      return normalizeReelEdit(initialEdit, dur);
    }
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

  const addBrollOverlay = useCallback(
    (assetId: string, label?: string) => {
      const sourceStart = edit.trimInSec + playheadSec;
      const { startSec, endSec } = clampBrollRange(
        sourceStart,
        sourceStart + 2.5,
        dur,
      );
      const overlay: BrollOverlay = {
        id: `broll-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        assetId,
        label,
        startSec,
        endSec,
        brollInSec: 0,
      };
      const brollOverlays = [...edit.brollOverlays, overlay].sort(
        (a, b) => a.startSec - b.startSec,
      );
      commit({ ...edit, brollOverlays });
    },
    [commit, edit, dur, playheadSec],
  );

  const updateBrollTiming = useCallback(
    (index: number, startSec: number, endSec: number) => {
      const next = edit.brollOverlays.map((b, i) => {
        if (i !== index) return b;
        const clamped = clampBrollRange(startSec, endSec, dur);
        return { ...b, ...clamped };
      });
      commit({ ...edit, brollOverlays: next.sort((a, b) => a.startSec - b.startSec) });
    },
    [commit, edit, dur],
  );

  const removeBrollOverlay = useCallback(
    (index: number) => {
      commit({
        ...edit,
        brollOverlays: edit.brollOverlays.filter((_, i) => i !== index),
      });
    },
    [commit, edit],
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
    addBrollOverlay,
    updateBrollTiming,
    removeBrollOverlay,
    setZoomIntensity: (zoomIntensity: number) =>
      commit({ ...edit, zoomIntensity }),
    undo,
    redo,
    setEdit,
  };
}
