import assert from "node:assert/strict";
import test from "node:test";
import {
  createMediaToken,
  signedMediaPath,
  verifyMediaToken,
} from "../lib/server/media-token";

test("media token verifies for signed path", () => {
  const relative = "jobs/test-id/reel.mp4";
  const { exp, sig } = createMediaToken(relative, 120);
  assert.equal(verifyMediaToken(relative, exp, sig), true);
  assert.equal(verifyMediaToken(relative, exp - 9999, sig), false);
});

test("signedMediaPath includes query params", () => {
  const path = signedMediaPath("jobs/a/thumb.jpg", 60);
  assert.match(path, /^\/api\/media\/jobs\/a\/thumb\.jpg\?exp=\d+&sig=/);
});
