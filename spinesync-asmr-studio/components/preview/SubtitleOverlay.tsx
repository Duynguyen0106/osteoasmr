"use client";

import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import type { CaptionSegment } from "@/lib/contract/job";

interface SubtitleOverlayProps {
  text: string;
  enabled: boolean;
  segments?: CaptionSegment[] | null;
  playbackTimeSec?: number;
}

function KaraokeText({
  segment,
  playbackTimeSec,
}: {
  segment: CaptionSegment;
  playbackTimeSec: number;
}) {
  if (segment.words?.length) {
    return (
      <>
        {segment.words.map((w, i) => {
          const active =
            playbackTimeSec >= w.start && playbackTimeSec <= w.end + 0.05;
          return (
            <span
              key={`${w.word}-${i}`}
              className={
                active
                  ? "text-yellow-300 drop-shadow-[0_0_12px_rgba(250,204,21,0.55)]"
                  : "text-slate-200"
              }
            >
              {w.word}{" "}
            </span>
          );
        })}
      </>
    );
  }

  const active =
    playbackTimeSec >= segment.start && playbackTimeSec <= segment.end;
  return (
    <span className={active ? "text-yellow-300" : "text-slate-200"}>
      {segment.text}
    </span>
  );
}

export function SubtitleOverlay({
  text,
  enabled,
  segments,
  playbackTimeSec = 0,
}: SubtitleOverlayProps) {
  const reduceMotion = useReducedMotion();

  if (!enabled) return null;

  const activeSegment =
    segments?.find(
      (s) => playbackTimeSec >= s.start && playbackTimeSec <= s.end + 0.05,
    ) ?? null;

  const displayText = activeSegment?.text ?? text;

  const content = (
    <span className="rounded bg-black/70 px-2 py-1 shadow-[0_0_20px_rgba(250,204,21,0.25)]">
      {activeSegment ? (
        <KaraokeText segment={activeSegment} playbackTimeSec={playbackTimeSec} />
      ) : (
        <span className="text-yellow-300">{displayText}</span>
      )}
    </span>
  );

  if (reduceMotion) {
    return (
      <p className="absolute bottom-[28%] left-0 right-0 z-20 px-3 text-center text-sm font-bold uppercase tracking-wide">
        {content}
      </p>
    );
  }

  return (
    <AnimatePresence mode="wait">
      <motion.p
        key={displayText}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        className="absolute bottom-[28%] left-0 right-0 z-20 px-3 text-center text-sm font-bold uppercase tracking-wide"
      >
        {content}
      </motion.p>
    </AnimatePresence>
  );
}
