import assert from "node:assert/strict";
import test from "node:test";
import {
  buildFfmpegEqualizer,
  eqBoostToGainDb,
  getAsmrProfile,
} from "../lib/asmr-profiles";

test("eqBoostToGainDb scales 0-100 to ~12dB max", () => {
  assert.equal(eqBoostToGainDb(0), 0);
  assert.equal(eqBoostToGainDb(100), 12);
  assert.equal(eqBoostToGainDb(50), 6);
});

test("focus profiles differ by center frequency", () => {
  const neck = getAsmrProfile("neck");
  const lumbar = getAsmrProfile("lumbar");
  assert.ok(neck.centerHz > lumbar.centerHz);
  assert.match(buildFfmpegEqualizer("neck", 6), /equalizer=f=4200/);
});
