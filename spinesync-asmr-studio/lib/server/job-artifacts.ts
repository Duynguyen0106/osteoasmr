import fs from "fs";
import path from "path";
import type { JobResult } from "@/lib/contract/job";
import { appBaseUrl } from "./config";
import { signedMediaPath } from "./media-token";
import { jobArtifactKey, getStorage } from "./storage";

const ARTIFACT_FILES = [
  "reel.mp4",
  "thumb.jpg",
  "captions.vtt",
  "segments.json",
  "audio-eq.wav",
] as const;

export async function publishJobArtifactsToStorage(jobId: string, jobDirPath: string) {
  const storage = getStorage();
  if (storage.driver !== "s3") return;

  for (const name of ARTIFACT_FILES) {
    const local = path.join(/* turbopackIgnore: true */ jobDirPath, name);
    if (!(await fileExists(local))) continue;
    const key = jobArtifactKey(jobId, name);
    await storage.putLocalFile(key, local);
  }
}

async function fileExists(p: string) {
  try {
    await fs.promises.access(p);
    return true;
  } catch {
    return false;
  }
}

export async function buildJobPreviewUrls(
  jobId: string,
): Promise<NonNullable<JobResult["previewUrls"]>> {
  const storage = getStorage();
  const reelKey = jobArtifactKey(jobId, "reel.mp4");
  const thumbKey = jobArtifactKey(jobId, "thumb.jpg");

  if (storage.driver === "s3") {
    const base = appBaseUrl();
    const reelPublic = await storage.getReadableUrl(reelKey);
    const thumbPublic = await storage.getReadableUrl(thumbKey);
    const reel =
      reelPublic.startsWith("http") ? reelPublic : `${base}${reelPublic}`;
    const thumb =
      thumbPublic.startsWith("http") ? thumbPublic : `${base}${thumbPublic}`;
    return {
      reel,
      thumb,
      captions: signedMediaPath(`jobs/${jobId}/captions.vtt`),
      karaoke: signedMediaPath(`jobs/${jobId}/segments.json`),
      audioEq: signedMediaPath(`jobs/${jobId}/audio-eq.wav`),
    };
  }

  return {
    reel: signedMediaPath(`jobs/${jobId}/reel.mp4`),
    thumb: signedMediaPath(`jobs/${jobId}/thumb.jpg`),
    captions: signedMediaPath(`jobs/${jobId}/captions.vtt`),
    karaoke: signedMediaPath(`jobs/${jobId}/segments.json`),
    audioEq: signedMediaPath(`jobs/${jobId}/audio-eq.wav`),
  };
}

export async function publishReelUrlForJob(jobId: string): Promise<string | null> {
  const storage = getStorage();
  const key = jobArtifactKey(jobId, "reel.mp4");
  if (storage.driver === "s3") {
    return storage.getReadableUrl(key);
  }
  return absoluteSignedMedia(jobId, "reel.mp4");
}

export async function publishThumbUrlForJob(jobId: string): Promise<string | null> {
  const storage = getStorage();
  const key = jobArtifactKey(jobId, "thumb.jpg");
  if (storage.driver === "s3") {
    return storage.getReadableUrl(key);
  }
  return absoluteSignedMedia(jobId, "thumb.jpg");
}

async function absoluteSignedMedia(jobId: string, fileName: string) {
  const base = appBaseUrl();
  const path = signedMediaPath(`jobs/${jobId}/${fileName}`, 86400);
  return `${base.replace(/\/$/, "")}${path}`;
}
