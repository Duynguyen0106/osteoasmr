import assert from "node:assert/strict";
import { test } from "node:test";
import { getCrackSample } from "@/lib/crack-samples";
import {
  crackSampleWavExists,
  resolveCrackWavFsPath,
} from "@/lib/server/crack-asset-path";

test("resolveCrackWavFsPath maps public URL to disk", () => {
  const p = resolveCrackWavFsPath("/audio/cracks/bright.wav");
  assert.ok(p.endsWith("public/audio/cracks/bright.wav"));
});

test("bundled crack WAVs exist on disk", () => {
  for (const sample of ["syn-bright", "syn-warm", "syn-deep", "syn-ribbon"]) {
    const def = getCrackSample(sample);
    assert.ok(crackSampleWavExists(def), `${sample} wav missing`);
  }
});
