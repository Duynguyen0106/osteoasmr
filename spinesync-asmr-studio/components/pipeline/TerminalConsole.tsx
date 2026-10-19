"use client";

import { Terminal } from "lucide-react";
import { useEffect, useRef } from "react";
import type { LogEntry } from "@/lib/types";

interface TerminalConsoleProps {
  logs: LogEntry[];
}

export function TerminalConsole({ logs }: TerminalConsoleProps) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  return (
    <section className="glass-panel rounded-2xl p-4" aria-live="polite">
      <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-white">
        <Terminal className="h-4 w-4 text-emerald-400" />
        Execution Console
      </h3>
      <div className="max-h-48 overflow-y-auto rounded-lg border border-slate-800 bg-black/60 p-3 font-mono text-[11px] leading-relaxed text-emerald-400/90">
        {logs.map((log) => (
          <div key={log.id} className="text-slate-400">
            <span className="text-slate-600">[{log.ts}]</span> {log.message}
          </div>
        ))}
        <div ref={endRef} />
      </div>
    </section>
  );
}
