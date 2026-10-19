import type { NextConfig } from "next";

/** Bundled ffmpeg/ffprobe must be traced into serverless bundles on Vercel. */
const FFMPEG_TRACE = [
  "./node_modules/ffmpeg-static/ffmpeg",
  "./node_modules/ffprobe-static/bin/**/*",
];

const nextConfig: NextConfig = {
  serverExternalPackages: [
    "better-sqlite3",
    "ffmpeg-static",
    "ffprobe-static",
    "@aws-sdk/client-s3",
    "@aws-sdk/s3-request-presigner",
    "@remotion/bundler",
    "@remotion/renderer",
    "ioredis",
  ],
  outputFileTracingIncludes: {
    "/api/health": FFMPEG_TRACE,
    "/api/jobs": FFMPEG_TRACE,
    "/api/jobs/[id]": FFMPEG_TRACE,
    "/api/jobs/[id]/stream": FFMPEG_TRACE,
    "/api/jobs/[id]/publish": FFMPEG_TRACE,
    "/api/preview/reel": FFMPEG_TRACE,
    "/api/preview/thumb": FFMPEG_TRACE,
    "/api/assets/[id]/analyze": FFMPEG_TRACE,
    "/api/assets/upload": FFMPEG_TRACE,
    "/api/assets/complete": FFMPEG_TRACE,
    "/api/assets/presign": FFMPEG_TRACE,
    "/api/media/[...path]": FFMPEG_TRACE,
  },
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
