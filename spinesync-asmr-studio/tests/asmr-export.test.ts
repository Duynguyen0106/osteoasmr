import assert from "node:assert/strict";
import test from "node:test";
import {
  ASMR_TARGET_LUFS,
  crackMixVolume,
  secondaryCrackDelaySec,
} from "../lib/asmr-export";

test("crackMixVolume scales with intensity", () => {
  assert.ok(crackMixVolume(0, 0.7) < 0.02);
  assert.ok(crackMixVolume(100, 0.7) > crackMixVolume(50, 0.7));
});

test("secondary crack delay is fraction of peak", () => {
  assert.equal(secondaryCrackDelaySec(4), 2.2);
});

test("target LUFS is -14", () => {
  assert.equal(ASMR_TARGET_LUFS, -14);
});
