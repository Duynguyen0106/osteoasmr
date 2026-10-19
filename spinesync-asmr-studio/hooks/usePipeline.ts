"use client";

import { useCallback, useState } from "react";
import confetti from "canvas-confetti";
import {
  STAGE_DURATION_MS,
  PIPELINE_STAGES,
  createInitialStageStatus,
  delay,
  formatLogTimestamp,
} from "@/lib/pipeline";
import type { LogEntry, PipelineStageId, PipelineState } from "@/lib/types";

function newLog(message: string): LogEntry {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    ts: formatLogTimestamp(),
    message,
  };
}

export function usePipeline() {
  const [pipeline, setPipeline] = useState<PipelineState>({
    running: false,
    progress: 0,
    currentStageId: null,
    stages: createInitialStageStatus(),
  });
  const [logs, setLogs] = useState<LogEntry[]>([
    {
      id: "boot",
      ts: "—",
      message: "SpineSync ASMR Studio v2.4 · awaiting media ingestion",
    },
  ]);
  const [pipelineComplete, setPipelineComplete] = useState(false);

  const appendLog = useCallback((message: string) => {
    setLogs((prev) => [...prev, newLog(message)]);
  }, []);

  const resetPipeline = useCallback(() => {
    setPipeline({
      running: false,
      progress: 0,
      currentStageId: null,
      stages: createInitialStageStatus(),
    });
    setPipelineComplete(false);
  }, []);

  const runFullPipeline = useCallback(async () => {
    if (pipeline.running) return;

    setPipelineComplete(false);
    setPipeline({
      running: true,
      progress: 0,
      currentStageId: null,
      stages: createInitialStageStatus(),
    });
    appendLog("▶ RUN FULL AI PIPELINE initiated");

    const total = PIPELINE_STAGES.length;

    for (let i = 0; i < total; i++) {
      const stage = PIPELINE_STAGES[i];
      const stageId = stage.id as PipelineStageId;

      setPipeline((prev) => ({
        ...prev,
        currentStageId: stageId,
        progress: Math.round((i / total) * 100),
        stages: { ...prev.stages, [stageId]: "running" },
      }));
      appendLog(`[${stage.label}] processing...`);

      await delay(STAGE_DURATION_MS);

      setPipeline((prev) => ({
        ...prev,
        progress: Math.round(((i + 1) / total) * 100),
        stages: { ...prev.stages, [stageId]: "done" },
      }));
      appendLog(stage.logMessage);
    }

    setPipeline((prev) => ({
      ...prev,
      running: false,
      currentStageId: null,
      progress: 100,
    }));
    setPipelineComplete(true);
    appendLog("✓ Pipeline complete — assets ready for dispatch");

    confetti({
      particleCount: 80,
      spread: 60,
      origin: { y: 0.7 },
      colors: ["#06b6d4", "#22d3ee", "#a855f7"],
    });
  }, [appendLog, pipeline.running]);

  return {
    pipeline,
    logs,
    pipelineComplete,
    appendLog,
    resetPipeline,
    runFullPipeline,
  };
}
