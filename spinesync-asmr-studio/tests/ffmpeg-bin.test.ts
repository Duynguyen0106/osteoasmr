import assert from "node:assert/strict";
import test from "node:test";
import {
  isEphemeralHosting,
  pipelineMediaReady,
} from "@/lib/server/ffmpeg-bin";

test("pipelineMediaReady requires S3 on ephemeral hosting", () => {
  const prev = process.env.SPINESYNC_DATA_ROOT;
  process.env.SPINESYNC_DATA_ROOT = "/tmp/spinesync";
  try {
    assert.equal(isEphemeralHosting(), true);
    assert.equal(pipelineMediaReady("local", false), false);
    assert.equal(pipelineMediaReady("s3", true), true);
  } finally {
    if (prev === undefined) delete process.env.SPINESYNC_DATA_ROOT;
    else process.env.SPINESYNC_DATA_ROOT = prev;
  }
});
