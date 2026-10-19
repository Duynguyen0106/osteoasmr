import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CRACK_SAMPLES,
  getCrackSample,
  previewCrackGain,
} from "@/lib/crack-samples";

test("crack sample library has unique ids", () => {
  const ids = CRACK_SAMPLES.map((s) => s.id);
  assert.equal(new Set(ids).size, ids.length);
});

test("getCrackSample falls back to bright", () => {
  assert.equal(getCrackSample("unknown").id, "syn-bright");
});

test("previewCrackGain scales with intensity", () => {
  const sample = getCrackSample("syn-bright");
  const low = previewCrackGain(10, "neck", sample);
  const high = previewCrackGain(90, "neck", sample);
  assert.ok(high > low);
});
