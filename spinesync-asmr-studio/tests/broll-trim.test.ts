import assert from "node:assert/strict";
import { test } from "node:test";
import type { ReelEditState } from "@/lib/contract/reel-edit";
import {
  brollForTrimmedExport,
  clampBrollRange,
  moveBrollOverlay,
} from "@/lib/reel-edit/broll";

const baseEdit = (over: Partial<ReelEditState> = {}): ReelEditState => ({
  trimInSec: 2,
  trimOutSec: 12,
  peakTimeSec: null,
  zoomIntensity: 100,
  markers: [],
  brollOverlays: [],
  ...over,
});

test("brollForTrimmedExport maps overlays into clip time", () => {
  const edit = baseEdit({
    brollOverlays: [
      {
        id: "1",
        assetId: "a1",
        startSec: 3,
        endSec: 5,
        brollInSec: 0,
      },
    ],
  });
  const out = brollForTrimmedExport(edit.brollOverlays, edit);
  assert.equal(out.length, 1);
  assert.equal(out[0]?.clipStartSec, 1);
  assert.equal(out[0]?.durationSec, 2);
});

test("brollForTrimmedExport drops overlays outside trim", () => {
  const edit = baseEdit({
    brollOverlays: [
      {
        id: "1",
        assetId: "a1",
        startSec: 0.5,
        endSec: 1.5,
        brollInSec: 0,
      },
    ],
  });
  assert.equal(brollForTrimmedExport(edit.brollOverlays, edit).length, 0);
});

test("moveBrollOverlay shifts within source duration", () => {
  const moved = moveBrollOverlay(
    {
      id: "1",
      assetId: "a",
      startSec: 4,
      endSec: 6,
      brollInSec: 0,
    },
    3,
    20,
  );
  assert.equal(moved.startSec, 7);
  assert.equal(moved.endSec, 9);
});

test("clampBrollRange enforces minimum span", () => {
  const { startSec, endSec } = clampBrollRange(5, 5.1, 30);
  assert.ok(endSec - startSec >= 0.25);
});
