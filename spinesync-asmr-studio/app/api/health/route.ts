import { connection } from "next/server";
import { NextResponse } from "next/server";
import { ensureDefaultProject, getProjectApiKey } from "@/lib/server/auth";
import {
  checkFfmpegAvailable,
  isEphemeralHosting,
  pipelineMediaReady,
} from "@/lib/server/ffmpeg-bin";
import {
  appBaseUrl,
  canPublishToAyrshare,
  hasAyrshare,
  hasOpenAI,
  hasS3Config,
  jobExecutor,
  jobQueueBackend,
  remotionRenderMode,
  remotionRenderRequested,
  requireApiKey,
  storageDriverEnv,
} from "@/lib/server/config";
import { redisQueueEnabled } from "@/lib/server/redis-queue";
import { getStorage } from "@/lib/server/storage";

export async function GET() {
  await connection();
  const ffmpegStatus = await checkFfmpegAvailable();

  ensureDefaultProject();
  const storage = getStorage();
  const defaultProjectId = ensureDefaultProject().id;
  const s3Configured = storage.driver === "s3" ? hasS3Config() : false;
  const ephemeral = isEphemeralHosting();
  const durableStorage = pipelineMediaReady(storage.driver, s3Configured);
  const pipelineReady = ffmpegStatus.ok && durableStorage;

  return NextResponse.json({
    ok: true,
    ffmpeg: ffmpegStatus.ok,
    ffmpegDetail: {
      bundled: ffmpegStatus.bundled,
      path: ffmpegStatus.ffmpegPath.includes("node_modules")
        ? "bundled"
        : ffmpegStatus.ffmpegPath,
    },
    hosting: {
      vercel: process.env.VERCEL === "1",
      ephemeralData: ephemeral,
      durableStorage,
      pipelineReady,
    },
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
      backend: redisQueueEnabled() ? "redis" : jobQueueBackend(),
    },
    remotion: {
      mode: remotionRenderMode(),
      requested: remotionRenderRequested(),
      lambdaDeployed: false,
    },
    auth: {
      defaultProjectId,
      apiKeyConfigured: Boolean(getProjectApiKey(defaultProjectId)),
      header: "x-spinesync-api-key",
      requireApiKey: requireApiKey(),
      sessionBootstrap: "/api/auth/bootstrap",
    },
    integrations: {
      openai: hasOpenAI(),
      ayrshare: hasAyrshare(),
      canPublishAyrshare: canPublishToAyrshare(),
      appBaseUrl: appBaseUrl(),
      storageDriverEnv: storageDriverEnv(),
    },
  });
}
