import type { JobCopyResult, PublishBody } from "@/lib/contract/job";

const PLATFORM_MAP: Record<string, string> = {
  "Instagram Reels": "instagram",
  TikTok: "tiktok",
  "YouTube Shorts": "youtube",
  "Facebook Reels": "facebook",
};

export function ayrsharePlatforms(publish: PublishBody): string[] {
  return publish.platforms
    .map((p) => PLATFORM_MAP[p] ?? p.toLowerCase())
    .filter(Boolean);
}

/** Build Ayrshare /post JSON (video + optional platform thumbnails). */
export function buildAyrsharePostBody(input: {
  caption: string;
  publish: PublishBody;
  mediaUrl: string;
  thumbUrl?: string | null;
  copy?: Pick<JobCopyResult, "headline" | "youtube"> | null;
  scheduleDate?: string;
}): Record<string, unknown> {
  const platforms = ayrsharePlatforms(input.publish);
  const body: Record<string, unknown> = {
    post: input.caption,
    platforms,
    mediaUrls: [input.mediaUrl],
    isVideo: true,
  };

  if (input.scheduleDate) {
    body.scheduleDate = input.scheduleDate;
  }

  const thumb = input.thumbUrl?.trim();
  if (thumb?.startsWith("https://")) {
    if (platforms.includes("twitter") || platforms.includes("x")) {
      body.twitterOptions = { thumbNail: thumb };
    }
    if (platforms.includes("youtube")) {
      const title = youtubeTitleFromCopy(input.copy);
      body.youTubeOptions = {
        title,
        shorts: true,
        thumbNail: thumb,
      };
    }
  } else if (platforms.includes("youtube")) {
    body.youTubeOptions = {
      title: youtubeTitleFromCopy(input.copy),
      shorts: true,
    };
  }

  return body;
}

function youtubeTitleFromCopy(
  copy?: Pick<JobCopyResult, "headline" | "youtube"> | null,
): string {
  const fromHeadline = copy?.headline?.trim();
  if (fromHeadline) return fromHeadline.slice(0, 100);
  const fromYoutube = copy?.youtube?.trim();
  if (fromYoutube) return fromYoutube.split("\n")[0]?.slice(0, 100) ?? "SpineSync ASMR";
  return "SpineSync ASMR Short";
}
