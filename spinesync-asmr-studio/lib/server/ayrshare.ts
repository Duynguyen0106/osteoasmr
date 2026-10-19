import type { PublishBody } from "@/lib/contract/job";
import { appBaseUrl, hasAyrshare } from "./config";

const PLATFORM_MAP: Record<string, string> = {
  "Instagram Reels": "instagram",
  TikTok: "tiktok",
  "YouTube Shorts": "youtube",
  "Facebook Reels": "facebook",
};

export interface AyrsharePublishInput {
  jobId: string;
  caption: string;
  publish: PublishBody;
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

  const platforms = input.publish.platforms
    .map((p) => PLATFORM_MAP[p] ?? p.toLowerCase())
    .filter(Boolean);

  const mediaUrl = `${appBaseUrl()}/api/media/jobs/${input.jobId}/reel.mp4`;

  const body: Record<string, unknown> = {
    post: input.caption,
    platforms,
    mediaUrls: [mediaUrl],
  };

  if (input.publish.mode === "queue") {
    body.scheduleDate = nextPeakHourIso();
  }

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

  return {
    ok: true,
    provider: "ayrshare",
    detail: input.publish.mode === "queue" ? "scheduled" : "posted",
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
