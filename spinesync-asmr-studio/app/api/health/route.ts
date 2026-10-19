import { NextResponse } from "next/server";
import { execFile } from "child_process";
import { promisify } from "util";
import { ensureDefaultProject, getProjectApiKey } from "@/lib/server/auth";
import {
  appBaseUrl,
  hasAyrshare,
  hasOpenAI,
  hasS3Config,
  jobExecutor,
  remotionRenderMode,
  storageDriverEnv,
} from "@/lib/server/config";
import { getStorage } from "@/lib/server/storage";

const execFileAsync = promisify(execFile);

export async function GET() {
  let ffmpeg = false;
  try {
    await execFileAsync("ffmpeg", ["-version"]);
    ffmpeg = true;
  } catch {
    ffmpeg = false;
  }

  ensureDefaultProject();
  const storage = getStorage();
  const defaultProjectId = ensureDefaultProject().id;

  return NextResponse.json({
    ok: true,
    ffmpeg,
    database: "sqlite",
    storage: {
      driver: storage.driver,
      configured: storage.driver === "s3" ? hasS3Config() : true,
      presign: storage.driver === "s3" && hasS3Config(),
      bucket: process.env.AWS_S3_BUCKET ?? null,
      cloudfront: process.env.AWS_CLOUDFRONT_DOMAIN ?? null,
    },
    queue: {
      executor: jobExecutor(),
    },
    remotion: {
      mode: remotionRenderMode(),
    },
    auth: {
      defaultProjectId,
      apiKeyConfigured: Boolean(getProjectApiKey(defaultProjectId)),
      header: "x-spinesync-api-key",
    },
    integrations: {
      openai: hasOpenAI(),
      ayrshare: hasAyrshare(),
      appBaseUrl: appBaseUrl(),
      storageDriverEnv: storageDriverEnv(),
    },
  });
}
