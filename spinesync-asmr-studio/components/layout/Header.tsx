"use client";

import { motion } from "framer-motion";
import { Bone, Cloud } from "lucide-react";
import { useEffect, useState } from "react";

type HealthPayload = {
  queue?: { executor?: string; backend?: string };
  integrations?: {
    openai?: boolean;
    ayrshare?: boolean;
    canPublishAyrshare?: boolean;
  };
  remotion?: { mode?: string };
  auth?: { requireApiKey?: boolean };
};

type ServiceRow = {
  name: string;
  status: string;
  color: string;
};

function executorLabel(health: HealthPayload | null): ServiceRow {
  const exec = health?.queue?.executor ?? "inline";
  const backend = health?.queue?.backend ?? "sqlite";
  return {
    name: "Job executor",
    status: backend === "redis" ? `worker · ${backend}` : exec,
    color: "bg-emerald-400",
  };
}

function openAiLabel(health: HealthPayload | null): ServiceRow {
  const on = health?.integrations?.openai;
  return {
    name: "Whisper / GPT",
    status: on ? "Configured" : "Fallback templates",
    color: on ? "bg-cyan-400" : "bg-amber-400",
  };
}

function ayrshareLabel(health: HealthPayload | null): ServiceRow {
  const key = health?.integrations?.ayrshare;
  const can = health?.integrations?.canPublishAyrshare;
  let status = "Stub (no key)";
  let color = "bg-slate-500";
  if (key && can) {
    status = "Live (HTTPS)";
    color = "bg-emerald-400";
  } else if (key) {
    status = "Key set · need HTTPS base URL";
    color = "bg-amber-400";
  }
  return { name: "Ayrshare", status, color };
}

export function Header() {
  const [health, setHealth] = useState<HealthPayload | null>(null);

  useEffect(() => {
    fetch("/api/health")
      .then((r) => r.json())
      .then((data) => setHealth(data as HealthPayload))
      .catch(() => setHealth(null));
  }, []);

  const services = [
    executorLabel(health),
    openAiLabel(health),
    ayrshareLabel(health),
  ];

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
          {services.map((svc) => (
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
