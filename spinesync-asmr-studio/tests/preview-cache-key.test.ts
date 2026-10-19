import assert from "node:assert/strict";
import { test } from "node:test";
import { incrementalPreviewCacheId } from "@/lib/server/preview-cache-key";

test("incrementalPreviewCacheId is stable for same payload", () => {
  const body = {
    assetId: "asset-1",
    edit: {
      trimInSec: 0,
      trimOutSec: 10,
      peakTimeSec: null,
      zoomIntensity: 100,
      markers: [],
    },
    autoPeakZoom: true,
  };
  const a = incrementalPreviewCacheId(body);
  const b = incrementalPreviewCacheId(body);
  assert.equal(a, b);
  assert.equal(a.length, 24);
});

test("incrementalPreviewCacheId changes when edit changes", () => {
  const base = {
    assetId: "asset-1",
    autoPeakZoom: true,
  };
  const a = incrementalPreviewCacheId({
    ...base,
    edit: {
      trimInSec: 0,
      trimOutSec: 10,
      peakTimeSec: null,
      zoomIntensity: 100,
      markers: [],
    },
  });
  const b = incrementalPreviewCacheId({
    ...base,
    edit: {
      trimInSec: 2,
      trimOutSec: 10,
      peakTimeSec: null,
      zoomIntensity: 100,
      markers: [],
    },
  });
  assert.notEqual(a, b);
});
