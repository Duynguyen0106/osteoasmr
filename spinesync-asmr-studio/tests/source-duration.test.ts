import assert from "node:assert/strict";
import { test } from "node:test";
import {
  resolveSourceDuration,
  sourceDurationLabel,
} from "@/lib/reel-edit/source-duration";

test("resolveSourceDuration prefers video over audio", () => {
  const r = resolveSourceDuration({ videoSec: 30, audioSec: 29.9 });
  assert.equal(r.durationSec, 30);
  assert.equal(r.source, "video");
  assert.equal(r.mismatch, false);
});

test("resolveSourceDuration flags audio/video mismatch", () => {
  const r = resolveSourceDuration({ videoSec: 60, audioSec: 58 });
  assert.equal(r.mismatch, true);
  assert.ok(r.mismatchDeltaSec > 0.35);
});

test("resolveSourceDuration falls back to audio then estimate", () => {
  assert.equal(
    resolveSourceDuration({ audioSec: 14.2 }).source,
    "audio",
  );
  assert.equal(resolveSourceDuration({ fallbackSec: 9 }).durationSec, 9);
  assert.equal(resolveSourceDuration({}).source, "fallback");
});

test("sourceDurationLabel is human readable", () => {
  assert.match(sourceDurationLabel("video"), /video/);
});
