"use client";

import type { StudioHealth } from "@/hooks/useStudioHealth";
import { IntegrationsSetupPanel } from "@/components/layout/IntegrationsSetupPanel";
import { RemotionSetupPanel } from "@/components/layout/RemotionSetupPanel";
import { S3StoragePanel } from "@/components/layout/S3StoragePanel";
import { ServerlessLimitsPanel } from "@/components/layout/ServerlessLimitsPanel";
import { WorkerQueuePanel } from "@/components/layout/WorkerQueuePanel";

interface StudioOpsPanelsProps {
  health: StudioHealth | null;
}

/** Conditional hosting / integration setup cards driven by /api/health */
export function StudioOpsPanels({ health }: StudioOpsPanelsProps) {
  return (
    <div className="space-y-2">
      <ServerlessLimitsPanel health={health} />
      <S3StoragePanel health={health} />
      <WorkerQueuePanel health={health} />
      <RemotionSetupPanel health={health} />
      <IntegrationsSetupPanel health={health} />
    </div>
  );
}
