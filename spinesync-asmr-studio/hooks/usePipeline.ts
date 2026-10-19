"use client";

import { useCallback, useRef, useState } from "react";
import confetti from "canvas-confetti";
import {
  STAGE_DURATION_MS,
  PIPELINE_STAGES,
  createInitialStageStatus,
  delay,
  formatLogTimestamp,
} from "@/lib/pipeline";
import type {
  LogEntry,
  PipelineRunContext,
  PipelineStageId,
  PipelineState,
} from "@/lib/types";

const MAX_LOG_ENTRIES = 200;

function newLog(message: string): LogEntry {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    ts: formatLogTimestamp(),
    message,
  };
}

function trimLogs(entries: LogEntry[]): LogEntry[] {
  if (entries.length <= MAX_LOG_ENTRIES) return entries;
  return entries.slice(entries.length - MAX_LOG_ENTRIES);
}

export function usePipeline() {
  const runningRef = useRef(false);
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
  const [copyRevision, setCopyRevision] = useState(0);

  const appendLog = useCallback((message: string) => {
    setLogs((prev) => trimLogs([...prev, newLog(message)]));
  }, []);

  const runFullPipeline = useCallback(
    async (ctx: PipelineRunContext) => {
      if (runningRef.current) return;

      runningRef.current = true;
      setPipelineComplete(false);
      setPipeline({
        running: true,
        progress: 0,
        currentStageId: null,
        stages: createInitialStageStatus(),
      });
      appendLog("▶ RUN FULL AI PIPELINE initiated");
      appendLog(
        `Source: ${ctx.sourceLabel} · focus=${ctx.focus} · EQ +${ctx.eqBoost}% · peak zoom=${ctx.toggles.autoPeakZoom ? "ON" : "OFF"} · SFX crack=${ctx.toggles.sfxCrack ? "ON" : "OFF"} · TikTok subs=${ctx.toggles.tiktokSubs ? "ON" : "OFF"}`,
      );

      const total = PIPELINE_STAGES.length;

      try {
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

          if (stageId === "eq" && ctx.toggles.sfxCrack) {
            appendLog(`${stage.logMessage} · synthesized crack layer merged`);
          } else if (stageId === "gpt") {
            setCopyRevision((r) => r + 1);
            appendLog(`${stage.logMessage} · copywriter UI refreshed`);
          } else {
            appendLog(stage.logMessage);
          }
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
      } finally {
        runningRef.current = false;
      }
    },
    [appendLog],
  );

  return {
    pipeline,
    logs,
    pipelineComplete,
    copyRevision,
    appendLog,
    runFullPipeline,
  };
}
