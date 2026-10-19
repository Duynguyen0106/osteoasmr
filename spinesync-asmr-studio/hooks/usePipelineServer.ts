"use client";

import { useCallback, useRef, useState } from "react";
import confetti from "canvas-confetti";
import type { JobCopyResult, JobResult } from "@/lib/contract/job";
import type { ReelEditState } from "@/lib/contract/reel-edit";
import { PIPELINE_STAGES, createInitialStageStatus } from "@/lib/pipeline";
import type { LogEntry, PipelineRunContext, PipelineStageId } from "@/lib/types";
import { spinesyncFetch } from "@/lib/api-client";

const MAX_LOG_ENTRIES = 200;

function trimLogs(entries: LogEntry[]): LogEntry[] {
  if (entries.length <= MAX_LOG_ENTRIES) return entries;
  return entries.slice(entries.length - MAX_LOG_ENTRIES);
}

interface UsePipelineServerOptions {
  assetId: string | null;
  onNeedAsset?: () => Promise<string | null>;
}

export function usePipelineServer(options: UsePipelineServerOptions) {
  const { assetId, onNeedAsset } = options;
  const [pipeline, setPipeline] = useState({
    running: false,
    progress: 0,
    currentStageId: null as PipelineStageId | null,
    stages: createInitialStageStatus(),
  });
  const [logs, setLogs] = useState<LogEntry[]>([
    {
      id: "boot",
      ts: "—",
      message: "SpineSync ASMR Studio v2.4 · server pipeline ready",
    },
  ]);
  const [pipelineComplete, setPipelineComplete] = useState(false);
  const [copyRevision, setCopyRevision] = useState(0);
  const [jobResult, setJobResult] = useState<JobResult | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [serverCopy, setServerCopy] = useState<JobCopyResult | null>(null);
  const [historyTick, setHistoryTick] = useState(0);
  const runningRef = useRef(false);

  const appendLog = useCallback((message: string) => {
    setLogs((prev) =>
      trimLogs([
        ...prev,
        {
          id: crypto.randomUUID(),
          ts: new Date().toLocaleTimeString("en-US", { hour12: false }),
          message,
        },
      ]),
    );
  }, []);

  const applyStageEvent = useCallback(
    (stageId: string, status: "running" | "done", progress: number) => {
      setPipeline((prev) => ({
        ...prev,
        running: status === "running" || prev.running,
        progress,
        currentStageId: status === "running" ? (stageId as PipelineStageId) : prev.currentStageId,
        stages: {
          ...prev.stages,
          [stageId as PipelineStageId]: status,
        },
      }));
    },
    [],
  );

  const applyJobSnapshot = useCallback(
    (data: {
      status: string;
      progress: number;
      currentStageId: string | null;
      stages: Record<PipelineStageId, "idle" | "running" | "done">;
      logs: LogEntry[];
      copyRevision: number;
      result: JobResult | null;
      error?: string | null;
    }) => {
      setLogs(trimLogs(data.logs));
      setCopyRevision(data.copyRevision);
      setPipeline((prev) => ({
        ...prev,
        progress: data.progress,
        currentStageId: data.currentStageId as PipelineStageId | null,
        stages: data.stages,
        running: data.status === "running" || data.status === "queued",
      }));

      if (data.status === "completed" && data.result) {
        setJobResult(data.result);
        setServerCopy(data.result.copy ?? null);
        setPipelineComplete(true);
        setHistoryTick((t) => t + 1);
        setPipeline((prev) => ({
          ...prev,
          running: false,
          progress: 100,
          currentStageId: null,
          stages: PIPELINE_STAGES.reduce(
            (acc, s) => {
              acc[s.id as PipelineStageId] = "done";
              return acc;
            },
            { ...createInitialStageStatus() },
          ),
        }));
        return true;
      }

      if (data.status === "failed") {
        throw new Error(data.error ?? "Job failed");
      }

      return false;
    },
    [],
  );

  const pollJobUntilDone = useCallback(
    async (id: string) => {
      for (let attempt = 0; attempt < 120; attempt += 1) {
        const res = await spinesyncFetch(`/api/jobs/${id}`);
        if (!res.ok) throw new Error("Failed to poll job status");
        const data = (await res.json()) as {
          status: string;
          progress: number;
          currentStageId: string | null;
          stages: Record<PipelineStageId, "idle" | "running" | "done">;
          logs: LogEntry[];
          copyRevision: number;
          result: JobResult | null;
          error?: string | null;
        };
        const done = applyJobSnapshot(data);
        if (done) return;
        await new Promise((r) => setTimeout(r, 1500));
      }
      throw new Error("Job polling timed out");
    },
    [applyJobSnapshot],
  );

  const runFullPipeline = useCallback(
    async (ctx: PipelineRunContext & { presetId?: string | null }) => {
      if (runningRef.current) return;
      runningRef.current = true;
      setPipelineComplete(false);
      setJobResult(null);
      setPipeline({
        running: true,
        progress: 0,
        currentStageId: null,
        stages: createInitialStageStatus(),
      });

      let resolvedAssetId = assetId;
      if (!resolvedAssetId && onNeedAsset) {
        resolvedAssetId = await onNeedAsset();
      }

      try {
        const res = await spinesyncFetch("/api/jobs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...ctx,
            assetId: resolvedAssetId ?? undefined,
            presetId: ctx.presetId,
          }),
        });
        if (!res.ok) {
          const err = (await res.json()) as { error?: string };
          throw new Error(err.error ?? "Failed to start job");
        }
        const { jobId: id } = (await res.json()) as { jobId: string };
        setJobId(id);

        await new Promise<void>((resolve, reject) => {
          const source = new EventSource(`/api/jobs/${id}?stream=sse`, {
            withCredentials: true,
          });

          const finishComplete = (result: JobResult, revision: number) => {
            setJobResult(result);
            setServerCopy(result.copy ?? null);
            setCopyRevision(revision);
              setPipelineComplete(true);
              setHistoryTick((t) => t + 1);
              setPipeline((prev) => ({
                ...prev,
                running: false,
                progress: 100,
                currentStageId: null,
                stages: PIPELINE_STAGES.reduce(
                  (acc, s) => {
                    acc[s.id as PipelineStageId] = "done";
                    return acc;
                  },
                  { ...createInitialStageStatus() },
                ),
              }));
              const reduceMotion = window.matchMedia(
              "(prefers-reduced-motion: reduce)",
            ).matches;
            if (!reduceMotion) {
              confetti({
                particleCount: 80,
                spread: 60,
                origin: { y: 0.7 },
                colors: ["#06b6d4", "#22d3ee", "#a855f7"],
              });
            }
            source.close();
            resolve();
          };

          source.onmessage = (event) => {
            const data = JSON.parse(event.data as string) as
              | { type: "log"; id: string; ts: string; message: string }
              | {
                  type: "stage";
                  stageId: string;
                  status: "running" | "done";
                  progress: number;
                }
              | { type: "complete"; result: JobResult; copyRevision: number }
              | { type: "error"; message: string };

            if (data.type === "log") {
              setLogs((prev) => trimLogs([...prev, data]));
            } else if (data.type === "stage") {
              applyStageEvent(data.stageId, data.status, data.progress);
            } else if (data.type === "complete") {
              finishComplete(data.result, data.copyRevision);
            } else if (data.type === "error") {
              source.close();
              reject(new Error(data.message));
            }
          };

          source.onerror = () => {
            source.close();
            appendLog("SSE reconnect · polling job status…");
            void pollJobUntilDone(id)
              .then(() => resolve())
              .catch(reject);
          };
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : "Pipeline failed";
        appendLog(`✗ ${message}`);
        setPipeline((prev) => ({ ...prev, running: false }));
      } finally {
        runningRef.current = false;
      }
    },
    [assetId, onNeedAsset, applyStageEvent, appendLog, pollJobUntilDone],
  );

  const publish = useCallback(
    async (mode: "immediate" | "queue") => {
      if (!jobId) {
        appendLog("Ayrshare · No completed server job — run pipeline first");
        return;
      }
      const res = await spinesyncFetch(`/api/jobs/${jobId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode, platforms: ["Instagram Reels", "TikTok", "YouTube Shorts", "Facebook Reels"] }),
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        appendLog(`Ayrshare · ${err.error ?? "Publish request failed"}`);
        return;
      }
      const snapshot = await spinesyncFetch(`/api/jobs/${jobId}`);
      if (snapshot.ok) {
        const data = (await snapshot.json()) as { logs: LogEntry[] };
        setLogs(trimLogs(data.logs));
      }
    },
    [jobId, appendLog],
  );

  const loadJob = useCallback(
    async (id: string, onEdit?: (edit: ReelEditState | undefined) => void) => {
      const res = await spinesyncFetch(`/api/jobs/${id}`);
      if (!res.ok) {
        appendLog(`Could not open job ${id.slice(0, 8)}…`);
        return;
      }
      const data = (await res.json()) as {
        id: string;
        status: string;
        progress: number;
        currentStageId: string | null;
        stages: Record<PipelineStageId, "idle" | "running" | "done">;
        logs: LogEntry[];
        copyRevision: number;
        result: JobResult | null;
        edit?: ReelEditState;
      };
      setJobId(data.id);
      onEdit?.(data.edit);
      setLogs(trimLogs(data.logs));
      setCopyRevision(data.copyRevision);
      setJobResult(data.result);
      setServerCopy(data.result?.copy ?? null);
      setPipelineComplete(data.status === "completed");
      setPipeline({
        running: data.status === "running" || data.status === "queued",
        progress: data.progress,
        currentStageId: data.currentStageId as PipelineStageId | null,
        stages: data.stages,
      });
      appendLog(`Opened job ${id.slice(0, 8)}… · ${data.status}`);
    },
    [appendLog],
  );

  const refreshJobMedia = useCallback(async () => {
    if (!jobId) return;
    const res = await spinesyncFetch(`/api/jobs/${jobId}`);
    if (!res.ok) return;
    const data = (await res.json()) as { result: JobResult | null };
    if (data.result) {
      setJobResult(data.result);
      if (data.result.copy) setServerCopy(data.result.copy);
    }
  }, [jobId]);

  return {
    pipeline,
    logs,
    pipelineComplete,
    copyRevision,
    appendLog,
    runFullPipeline,
    jobResult,
    serverCopy,
    jobId,
    publish,
    refreshJobMedia,
    loadJob,
    historyTick,
  };
}
