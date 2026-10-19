import assert from "node:assert/strict";
import { test } from "node:test";
import { pipelineBlockers } from "@/lib/server/pipeline-readiness";

test("pipelineBlockers lists ffmpeg and S3 on ephemeral local storage", () => {
  const prev = process.env.SPINESYNC_DATA_ROOT;
  process.env.SPINESYNC_DATA_ROOT = "/tmp/spinesync";
  try {
    const blockers = pipelineBlockers({
      ffmpegOk: false,
      ffmpegError: "ffmpeg: ENOENT",
      durableStorage: false,
      storageDriver: "local",
      durableConfigured: false,
    });
    assert.ok(blockers.some((b) => b.includes("ffmpeg")));
    assert.ok(blockers.some((b) => b.includes("STORAGE_DRIVER=s3")));
  } finally {
    if (prev === undefined) delete process.env.SPINESYNC_DATA_ROOT;
    else process.env.SPINESYNC_DATA_ROOT = prev;
  }
});

test("pipelineBlockers empty when ffmpeg and durable storage ok", () => {
  assert.deepEqual(
    pipelineBlockers({
      ffmpegOk: true,
      durableStorage: true,
      storageDriver: "s3",
      durableConfigured: true,
    }),
    [],
  );
});
