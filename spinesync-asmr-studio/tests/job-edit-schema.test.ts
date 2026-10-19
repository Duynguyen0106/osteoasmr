import assert from "node:assert/strict";
import { test } from "node:test";
import { createJobBodySchema } from "@/lib/contract/job";

test("createJobBodySchema accepts edit payload", () => {
  const parsed = createJobBodySchema.safeParse({
    focus: "neck",
    eqBoost: 50,
    toggles: { autoPeakZoom: true, sfxCrack: true, tiktokSubs: false },
    sourceLabel: "clip.mp4",
    edit: {
      trimInSec: 1.5,
      trimOutSec: 12,
      peakTimeSec: 4,
      thumbTimeSec: 6.5,
      zoomIntensity: 80,
      markers: [{ id: "m1", timeSec: 2, color: "cyan" }],
      brollOverlays: [
        {
          id: "b1",
          assetId: "asset-xyz",
          startSec: 1,
          endSec: 3,
          brollInSec: 0,
        },
      ],
    },
  });
  assert.equal(parsed.success, true);
});

test("createJobBodySchema rejects invalid edit zoom", () => {
  const parsed = createJobBodySchema.safeParse({
    focus: "neck",
    eqBoost: 50,
    toggles: { autoPeakZoom: true, sfxCrack: true, tiktokSubs: false },
    sourceLabel: "clip.mp4",
    edit: { trimInSec: 0, trimOutSec: null, peakTimeSec: null, zoomIntensity: 200 },
  });
  assert.equal(parsed.success, false);
});
