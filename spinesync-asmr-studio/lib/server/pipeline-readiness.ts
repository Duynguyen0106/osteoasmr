import { isEphemeralHosting } from "./ffmpeg-bin";

/** Human-readable reasons the server pipeline cannot run. */
export function pipelineBlockers(input: {
  ffmpegOk: boolean;
  ffmpegError?: string | null;
  durableStorage: boolean;
  storageDriver: "local" | "s3";
  s3Configured: boolean;
}): string[] {
  const blockers: string[] = [];
  if (!input.ffmpegOk) {
    blockers.push(
      input.ffmpegError?.trim() ||
        "ffmpeg/ffprobe not executable — set FFMPEG_PATH or ensure bundled binaries are deployed",
    );
  }
  if (!input.durableStorage) {
    if (isEphemeralHosting() && input.storageDriver === "local") {
      blockers.push(
        "Ephemeral hosting: set STORAGE_DRIVER=s3, AWS_S3_BUCKET, AWS_REGION, and IAM credentials in Vercel",
      );
    } else if (input.storageDriver === "s3" && !input.s3Configured) {
      blockers.push(
        "STORAGE_DRIVER=s3 but bucket/region/credentials are incomplete",
      );
    } else {
      blockers.push("Durable storage not configured for this host");
    }
  }
  return blockers;
}
