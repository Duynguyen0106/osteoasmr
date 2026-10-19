"use client";

import { History, Link2, Loader2 } from "lucide-react";
import Link from "next/link";
import { jobEditPath } from "@/lib/studio-routes";
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
              <div
                className={`flex items-center gap-1 rounded-lg border pr-1 transition ${
                  activeJobId === job.id
                    ? "border-cyan-400/40 bg-cyan-500/10"
                    : "border-slate-700/50 bg-slate-900/30"
                }`}
              >
                <button
                  type="button"
                  onClick={() => onOpenJob(job.id)}
                  className={`min-w-0 flex-1 rounded-lg px-2 py-1.5 text-left text-xs ${
                    activeJobId === job.id ? "text-cyan-100" : "text-slate-300"
                  }`}
                >
                  <span className="block truncate font-medium">{job.sourceLabel}</span>
                  <span className="font-mono text-[10px] text-slate-500">
                    {job.status} · {job.id.slice(0, 8)}
                  </span>
                </button>
                <Link
                  href={jobEditPath(job.id)}
                  className="shrink-0 rounded-md p-1.5 text-slate-500 hover:bg-slate-800/80 hover:text-cyan-300"
                  title="Open editor deep link"
                  aria-label={`Editor link for job ${job.id.slice(0, 8)}`}
                >
                  <Link2 className="h-3.5 w-3.5" aria-hidden />
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
