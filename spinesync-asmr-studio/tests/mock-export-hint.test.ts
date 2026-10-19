import assert from "node:assert/strict";
import { test } from "node:test";
import {
  mockReelEditBannerLine,
  mockReelEditPipelineLog,
} from "@/lib/reel-edit/mock-export-hint";

test("mock export hints include clip summary", () => {
  const edit = {
    trimInSec: 1,
    trimOutSec: 8,
    peakTimeSec: 2,
    zoomIntensity: 100,
    markers: [],
    brollOverlays: [],
    captions: [{ start: 0, end: 1, text: "hi" }],
  };
  assert.match(mockReelEditBannerLine(edit, 10), /7\.0s clip/);
  assert.match(mockReelEditPipelineLog(edit), /mock — not exported/);
});
