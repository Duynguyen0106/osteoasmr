import assert from "node:assert/strict";
import { test } from "node:test";
import {
  clampCaptionRange,
  moveCaptionSegment,
  sourceCaptionsToClipPreview,
} from "@/lib/reel-edit/caption-timing";

test("clampCaptionRange enforces minimum duration", () => {
  const { start, end } = clampCaptionRange(1, 1.05, 10);
  assert.ok(end - start >= 0.12);
});

test("moveCaptionSegment preserves duration", () => {
  const moved = moveCaptionSegment(
    { start: 2, end: 4, text: "x" },
    1,
    20,
  );
  assert.equal(moved.end - moved.start, 2);
  assert.equal(moved.start, 3);
});

test("sourceCaptionsToClipPreview offsets for karaoke", () => {
  const clip = sourceCaptionsToClipPreview(
    [{ start: 5, end: 7, text: "hi" }],
    5,
  );
  assert.equal(clip[0].start, 0);
  assert.equal(clip[0].end, 2);
});
