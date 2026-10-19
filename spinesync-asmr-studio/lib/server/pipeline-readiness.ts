import { isEphemeralHosting } from "./ffmpeg-bin";

/** Human-readable reasons the server pipeline cannot run. */
export function pipelineBlockers(input: {
  ffmpegOk: boolean;
  ffmpegError?: string | null;
  durableStorage: boolean;
  storageDriver: "local" | "s3" | "blob";
  durableConfigured: boolean;
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
        "Ephemeral hosting: set STORAGE_DRIVER=blob (Vercel Blob) or STORAGE_DRIVER=s3 with AWS credentials",
      );
    } else if (input.storageDriver === "s3" && !input.durableConfigured) {
      blockers.push(
        "STORAGE_DRIVER=s3 but bucket/region/credentials are incomplete",
      );
    } else if (input.storageDriver === "blob" && !input.durableConfigured) {
      blockers.push(
        "STORAGE_DRIVER=blob but BLOB_READ_WRITE_TOKEN is missing — connect Vercel Blob to this project",
      );
    } else {
      blockers.push("Durable storage not configured for this host");
    }
  }
  return blockers;
}
