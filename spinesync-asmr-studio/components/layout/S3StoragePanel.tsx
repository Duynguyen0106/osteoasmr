"use client";

import { CloudUpload } from "lucide-react";
import type { StudioHealth } from "@/hooks/useStudioHealth";
import { isServerPipeline } from "@/lib/pipeline-mode";

const S3_ENV_LINES = [
  "STORAGE_DRIVER=s3",
  "AWS_REGION=us-east-1",
  "AWS_S3_BUCKET=your-bucket",
  "AWS_ACCESS_KEY_ID=…",
  "AWS_SECRET_ACCESS_KEY=…",
  "# optional: AWS_CLOUDFRONT_DOMAIN=dxxx.cloudfront.net",
  "SPINESYNC_DATA_ROOT=/tmp/spinesync",
] as const;

interface S3StoragePanelProps {
  health: StudioHealth | null;
}

export function S3StoragePanel({ health }: S3StoragePanelProps) {
  const needsS3 =
    isServerPipeline &&
    health?.hosting?.ephemeralData === true &&
    health.hosting.durableStorage !== true;

  if (!needsS3) return null;

  const copyBlock = S3_ENV_LINES.join("\n");

  return (
    <div className="rounded-xl border border-violet-500/25 bg-violet-950/30 p-3 space-y-2">
      <div className="flex items-center gap-2 text-xs font-semibold text-violet-100">
        <CloudUpload className="h-4 w-4 text-violet-400" aria-hidden />
        Durable storage (S3) required
      </div>
      <p className="text-[11px] text-slate-400 leading-relaxed">
        This host uses ephemeral disk (e.g. Vercel <code className="text-slate-300">/tmp</code>
        ). Uploads, SQLite, and rendered reels are lost between invocations until S3 is
        configured. Set these in your project environment, redeploy, then confirm{" "}
        <code className="text-slate-300">/api/health</code> reports{" "}
        <code className="text-slate-300">hosting.durableStorage: true</code>.
      </p>
      <pre className="overflow-x-auto rounded-lg bg-slate-950/80 p-2 font-mono text-[10px] text-violet-200/90">
        {copyBlock}
      </pre>
      <button
        type="button"
        className="rounded-lg border border-violet-500/40 bg-violet-500/10 px-2 py-1 text-[11px] text-violet-100 hover:bg-violet-500/20"
        onClick={() => void navigator.clipboard.writeText(copyBlock)}
      >
        Copy env block
      </button>
    </div>
  );
}
