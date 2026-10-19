"use client";

import { useCallback, useRef, useState } from "react";
import confetti from "canvas-confetti";
import type { JobCopyResult, JobResult } from "@/lib/contract/job";
import { PIPELINE_STAGES, createInitialStageStatus } from "@/lib/pipeline";
import type { LogEntry, PipelineRunContext, PipelineStageId } from "@/lib/types";

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
  const runningRef = useRef(false);

  const appendLog = useCallback((message: string) => {
    setLogs((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        ts: new Date().toLocaleTimeString("en-US", { hour12: false }),
        message,
      },
    ]);
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
        const res = await fetch("/api/jobs", {
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
          const source = new EventSource(`/api/jobs/${id}/stream`);
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
              setLogs((prev) => [...prev, data]);
            } else if (data.type === "stage") {
              applyStageEvent(data.stageId, data.status, data.progress);
            } else if (data.type === "complete") {
              setJobResult(data.result);
              setServerCopy(data.result.copy ?? null);
              setCopyRevision(data.copyRevision);
              setPipelineComplete(true);
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
            } else if (data.type === "error") {
              source.close();
              reject(new Error(data.message));
            }
          };
          source.onerror = () => {
            source.close();
            reject(new Error("SSE connection lost"));
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
    [assetId, onNeedAsset, applyStageEvent, appendLog],
  );

  const publish = useCallback(
    async (mode: "immediate" | "queue") => {
      if (!jobId) {
        appendLog("Ayrshare · No completed server job — run pipeline first");
        return;
      }
      const res = await fetch(`/api/jobs/${jobId}/publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode }),
      });
      if (!res.ok) {
        appendLog("Ayrshare · Publish request failed");
        return;
      }
      const snapshot = await fetch(`/api/jobs/${jobId}`);
      if (snapshot.ok) {
        const data = (await snapshot.json()) as { logs: LogEntry[] };
        setLogs(data.logs);
      }
    },
    [jobId, appendLog],
  );

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
  };
}
