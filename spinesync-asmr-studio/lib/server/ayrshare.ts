import type { JobCopyResult, PublishBody } from "@/lib/contract/job";
import { appBaseUrl, canPublishToAyrshare, hasAyrshare } from "./config";
import { buildAyrsharePostBody } from "./ayrshare-post-body";
import { publishReelUrlForJob, publishThumbUrlForJob } from "./job-artifacts";

export interface AyrsharePublishInput {
  jobId: string;
  caption: string;
  publish: PublishBody;
  copy?: JobCopyResult | null;
}

export async function publishViaAyrshare(
  input: AyrsharePublishInput,
): Promise<{ ok: boolean; provider: string; detail: string; postId?: string }> {
  if (!hasAyrshare()) {
    return {
      ok: true,
      provider: "stub",
      detail: "AYRSHARE_API_KEY not set — logged only",
    };
  }

  if (!canPublishToAyrshare()) {
    return {
      ok: false,
      provider: "ayrshare",
      detail: `APP_BASE_URL must be HTTPS (current: ${appBaseUrl()}) for live Ayrshare posts`,
    };
  }

  const mediaUrl = (await publishReelUrlForJob(input.jobId)) ?? "";
  if (!mediaUrl.startsWith("http")) {
    return {
      ok: false,
      provider: "ayrshare",
      detail: "Could not resolve public reel URL for publish",
    };
  }

  const thumbUrl = await publishThumbUrlForJob(input.jobId);
  const body = buildAyrsharePostBody({
    caption: input.caption,
    publish: input.publish,
    mediaUrl,
    thumbUrl,
    copy: input.copy ?? null,
    scheduleDate:
      input.publish.mode === "queue" ? nextPeakHourIso() : undefined,
  });

  const res = await fetch("https://app.ayrshare.com/api/post", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.AYRSHARE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const json = (await res.json().catch(() => ({}))) as {
    id?: string;
    postId?: string;
    message?: string;
    errors?: unknown;
  };

  if (!res.ok) {
    return {
      ok: false,
      provider: "ayrshare",
      detail: json.message ?? `HTTP ${res.status}`,
    };
  }

  const thumbNote =
    thumbUrl?.startsWith("https://") ? " · thumb attached" : "";

  return {
    ok: true,
    provider: "ayrshare",
    detail:
      (input.publish.mode === "queue" ? "scheduled" : "posted") + thumbNote,
    postId: json.id ?? json.postId,
  };
}

function nextPeakHourIso(): string {
  const d = new Date();
  d.setHours(18, 0, 0, 0);
  if (d.getTime() <= Date.now()) {
    d.setDate(d.getDate() + 1);
  }
  return d.toISOString();
}
