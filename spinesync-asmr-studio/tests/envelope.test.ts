import assert from "node:assert/strict";
import { test } from "node:test";
import { analyzeChannelEnvelope, ENVELOPE_SIZE } from "@/lib/audio/envelope";

test("analyzeChannelEnvelope returns normalized envelope", () => {
  const len = 48_000;
  const channel = new Float32Array(len);
  for (let i = 0; i < len; i += 1) {
    channel[i] = i > len / 2 ? 0.8 : 0.01;
  }
  const profile = analyzeChannelEnvelope(channel, 1);
  assert.equal(profile.envelope.length, ENVELOPE_SIZE);
  assert.ok(profile.peakTimeSec > 0.4);
  assert.ok(Math.max(...profile.envelope) <= 1.001);
});
