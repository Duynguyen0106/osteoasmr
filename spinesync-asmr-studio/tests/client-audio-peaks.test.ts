import assert from "node:assert/strict";
import test from "node:test";
import { envelopeBarHeight } from "../lib/client-audio-peaks";

test("envelopeBarHeight returns bounded values", () => {
  const envelope = Array.from({ length: 64 }, (_, i) =>
    i === 32 ? 1 : 0.2,
  );
  const h = envelopeBarHeight(
    10,
    48,
    2,
    envelope,
    10,
    65,
    true,
    3.2,
  );
  assert.ok(h >= 0.08 && h <= 1);
});
