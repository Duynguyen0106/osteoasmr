import assert from "node:assert/strict";
import { test } from "node:test";
import { buildAyrsharePostBody } from "@/lib/server/ayrshare-post-body";

const publish = {
  mode: "immediate" as const,
  platforms: ["YouTube Shorts", "TikTok"],
};

test("buildAyrsharePostBody sets isVideo and YouTube title from copy headline", () => {
  const body = buildAyrsharePostBody({
    caption: "IG caption",
    publish,
    mediaUrl: "https://cdn.example.com/reel.mp4",
    copy: {
      headline: "NECK CRACK INSANE 💥",
      youtube: "Long form YT copy",
    },
  });
  assert.equal(body.isVideo, true);
  const yt = body.youTubeOptions as { title: string; shorts: boolean };
  assert.equal(yt.title, "NECK CRACK INSANE 💥");
  assert.equal(yt.shorts, true);
});

test("buildAyrsharePostBody attaches thumbNail for YouTube when HTTPS thumb", () => {
  const body = buildAyrsharePostBody({
    caption: "Post",
    publish: {
      mode: "immediate",
      platforms: ["YouTube Shorts"],
    },
    mediaUrl: "https://cdn.example.com/reel.mp4",
    thumbUrl: "https://cdn.example.com/thumb.jpg",
    copy: { headline: "Title", youtube: "" },
  });
  const yt = body.youTubeOptions as { thumbNail: string; title: string };
  assert.equal(yt.thumbNail, "https://cdn.example.com/thumb.jpg");
});

test("buildAyrsharePostBody adds twitterOptions thumb when platform included", () => {
  const body = buildAyrsharePostBody({
    caption: "Post",
    publish: {
      mode: "immediate",
      platforms: ["TikTok", "Instagram Reels"],
    },
    mediaUrl: "https://cdn.example.com/reel.mp4",
    thumbUrl: "https://cdn.example.com/thumb.jpg",
  });
  assert.equal(body.twitterOptions, undefined);
});
