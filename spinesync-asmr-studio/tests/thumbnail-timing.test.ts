import assert from "node:assert/strict";
import { test } from "node:test";
import type { ReelEditState } from "@/lib/contract/reel-edit";
import { thumbnailSeekOnClip } from "@/lib/reel-edit/thumbnail";

const base = (over: Partial<ReelEditState> = {}): ReelEditState => ({
  trimInSec: 0,
  trimOutSec: 20,
  peakTimeSec: 4,
  thumbTimeSec: null,
  zoomIntensity: 100,
  markers: [],
  brollOverlays: [],
  ...over,
});

test("thumbnailSeekOnClip uses thumbTimeSec when set", () => {
  assert.equal(
    thumbnailSeekOnClip(base({ thumbTimeSec: 7 }), 4),
    7,
  );
});

test("thumbnailSeekOnClip falls back to peak on clip", () => {
  assert.equal(thumbnailSeekOnClip(base(), 5.5), 5.5);
});

test("thumbnailSeekOnClip clamps to clip duration", () => {
  assert.equal(
    thumbnailSeekOnClip(base({ trimInSec: 0, trimOutSec: 10, thumbTimeSec: 99 }), 4),
    10,
  );
});
