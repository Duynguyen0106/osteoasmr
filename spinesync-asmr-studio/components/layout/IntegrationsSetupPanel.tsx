"use client";

import { Sparkles, Share2 } from "lucide-react";
import type { StudioHealth } from "@/hooks/useStudioHealth";
import { isServerPipeline } from "@/lib/pipeline-mode";
import { OpsEnvBlock } from "@/components/layout/OpsEnvBlock";

const OPENAI_LINES = [
  "OPENAI_API_KEY=sk-...",
  "OPENAI_COPY_MODEL=gpt-4o-mini",
] as const;

const AYRSHARE_LINES = [
  "AYRSHARE_API_KEY=...",
  "APP_BASE_URL=https://your-app.vercel.app",
] as const;

interface IntegrationsSetupPanelProps {
  health: StudioHealth | null;
}

export function IntegrationsSetupPanel({ health }: IntegrationsSetupPanelProps) {
  if (!isServerPipeline || !health?.integrations) return null;

  const needOpenai = !health.integrations.openai;
  const needPublishSetup = !health.integrations.canPublishAyrshare;

  if (!needOpenai && !needPublishSetup) return null;

  return (
    <div className="space-y-2">
      {needOpenai && (
        <OpsEnvBlock
          title="OpenAI copywriter (optional)"
          icon={<Sparkles className="h-4 w-4 text-emerald-400" aria-hidden />}
          borderClass="border-emerald-500/20 bg-emerald-950/20"
          titleClass="text-emerald-100"
          description={
            <>
              Without <code className="text-slate-300">OPENAI_API_KEY</code>, the GPT pipeline
              stage uses deterministic stub copy. Add a key to generate Instagram / YouTube /
              hashtag variants from your peak metadata.
            </>
          }
          envLines={OPENAI_LINES}
        />
      )}
      {needPublishSetup && (
        <OpsEnvBlock
          title="Live social publish"
          icon={<Share2 className="h-4 w-4 text-sky-400" aria-hidden />}
          borderClass="border-sky-500/20 bg-sky-950/20"
          titleClass="text-sky-100"
          description={
            health.integrations.ayrshare ? (
              <>
                Ayrshare key is set but <code className="text-slate-300">APP_BASE_URL</code> must
                be a public HTTPS URL (not localhost) before posts are enabled.
              </>
            ) : (
              <>
                Add Ayrshare for multi-channel dispatch. Social buttons stay disabled until both
                key and HTTPS base URL are configured.
              </>
            )
          }
          envLines={AYRSHARE_LINES}
        />
      )}
    </div>
  );
}
