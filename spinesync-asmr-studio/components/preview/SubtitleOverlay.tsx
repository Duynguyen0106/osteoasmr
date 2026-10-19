"use client";

import { motion, AnimatePresence } from "framer-motion";

interface SubtitleOverlayProps {
  text: string;
  enabled: boolean;
}

export function SubtitleOverlay({ text, enabled }: SubtitleOverlayProps) {
  if (!enabled) return null;

  return (
    <AnimatePresence mode="wait">
      <motion.p
        key={text}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        className="absolute bottom-[28%] left-0 right-0 px-3 text-center text-sm font-bold uppercase tracking-wide"
      >
        <span className="rounded bg-black/70 px-2 py-1 text-yellow-300 shadow-[0_0_20px_rgba(250,204,21,0.4)]">
          {text}
        </span>
      </motion.p>
    </AnimatePresence>
  );
}
