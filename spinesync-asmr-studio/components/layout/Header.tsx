"use client";

import { motion } from "framer-motion";
import { Bone, Cloud } from "lucide-react";

const SERVICES = [
  { name: "AWS Lambda", status: "Ready", color: "bg-emerald-400" },
  { name: "Whisper AI", status: "Active", color: "bg-cyan-400" },
  { name: "Ayrshare API", status: "Connected", color: "bg-emerald-400" },
] as const;

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-cyan-500/10 bg-[#090d16]/85 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          <motion.div
            className="spine-icon-glow flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-500/30 bg-cyan-500/10"
            animate={{ rotate: [0, -8, 8, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          >
            <Bone className="h-5 w-5 text-cyan-400" aria-hidden />
          </motion.div>
          <div>
            <p className="text-xs font-medium uppercase tracking-widest text-cyan-400/80">
              Medical-tech automation
            </p>
            <h1 className="text-lg font-semibold tracking-tight text-white sm:text-xl">
              SpineSync ASMR <span className="text-cyan-400">v2.4</span>
            </h1>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {SERVICES.map((svc) => (
            <div
              key={svc.name}
              className="status-pill flex items-center gap-2 rounded-full px-3 py-1.5 text-xs"
            >
              <Cloud className="h-3.5 w-3.5 text-cyan-400/70" aria-hidden />
              <span className="text-slate-300">{svc.name}:</span>
              <span className="font-medium text-cyan-300">{svc.status}</span>
              <span
                className={`h-2 w-2 rounded-full ${svc.color} shadow-[0_0_8px_currentColor]`}
                aria-hidden
              />
            </div>
          ))}
        </div>
      </div>
    </header>
  );
}
