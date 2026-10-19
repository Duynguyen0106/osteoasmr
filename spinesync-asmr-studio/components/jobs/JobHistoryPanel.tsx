"use client";

import { History, Loader2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { spinesyncFetch } from "@/lib/api-client";

export interface JobHistoryRow {
  id: string;
  status: string;
  progress: number;
  createdAt: string;
  sourceLabel: string;
}

interface JobHistoryPanelProps {
  activeJobId: string | null;
  onOpenJob: (jobId: string) => void;
  refreshKey?: number;
}

async function pullJobs(): Promise<JobHistoryRow[]> {
  const res = await spinesyncFetch("/api/jobs");
  if (!res.ok) return [];
  const data = (await res.json()) as { jobs: JobHistoryRow[] };
  return data.jobs.map((j) => ({
    ...j,
    createdAt:
      typeof j.createdAt === "string"
        ? j.createdAt
        : new Date(j.createdAt).toISOString(),
  }));
}

export function JobHistoryPanel({
  activeJobId,
  onOpenJob,
  refreshKey = 0,
}: JobHistoryPanelProps) {
  const [jobs, setJobs] = useState<JobHistoryRow[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const next = await pullJobs();
    setJobs(next);
    setLoading(false);
  }, []);

  useEffect(() => {
    let cancelled = false;
    pullJobs().then((next) => {
      if (!cancelled) {
        setJobs(next);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  return (
    <div className="glass-panel rounded-2xl p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-white">
          <History className="h-4 w-4 text-cyan-400" aria-hidden />
          Job history
        </h3>
        <button
          type="button"
          onClick={() => void refresh()}
          className="text-[10px] uppercase tracking-wide text-cyan-400/80 hover:text-cyan-300"
        >
          Refresh
        </button>
      </div>
      {loading ? (
        <p className="flex items-center gap-2 text-xs text-slate-500">
          <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
          Loading jobs…
        </p>
      ) : jobs.length === 0 ? (
        <p className="text-xs text-slate-500">No server jobs yet — run the pipeline.</p>
      ) : (
        <ul className="max-h-48 space-y-1 overflow-y-auto">
          {jobs.map((job) => (
            <li key={job.id}>
              <button
                type="button"
                onClick={() => onOpenJob(job.id)}
                className={`flex w-full items-center justify-between gap-2 rounded-lg border px-2 py-1.5 text-left text-xs transition ${
                  activeJobId === job.id
                    ? "border-cyan-400/40 bg-cyan-500/10 text-cyan-100"
                    : "border-slate-700/50 bg-slate-900/30 text-slate-300 hover:border-cyan-500/20"
                }`}
              >
                <span className="truncate font-medium">{job.sourceLabel}</span>
                <span className="shrink-0 font-mono text-[10px] text-slate-500">
                  {job.status} · {job.id.slice(0, 8)}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
