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
    "@vercel/blob",
    "@remotion/bundler",
    "@remotion/renderer",
    "ioredis",
  ],
  outputFileTracingIncludes: {
    "/api/health": FFMPEG_TRACE,
    "/api/jobs": FFMPEG_TRACE,
    "/api/jobs/[id]": FFMPEG_TRACE,
    "/api/preview": FFMPEG_TRACE,
    "/api/assets": FFMPEG_TRACE,
    "/api/media/[...path]": FFMPEG_TRACE,
  },
  /** Off on Hobby — PPR routes can count toward the 12-function cap. */
  cacheComponents: false,
  partialPrefetching: false,
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
