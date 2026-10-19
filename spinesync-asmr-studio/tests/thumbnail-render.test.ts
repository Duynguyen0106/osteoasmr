import assert from "node:assert/strict";
import { test } from "node:test";
import {
  clampThumbnailSeekSec,
  escapeDrawtext,
} from "@/lib/server/thumbnail-render";

test("clampThumbnailSeekSec stays inside duration", () => {
  assert.equal(clampThumbnailSeekSec(10, 4.2), 4.2);
  assert.equal(clampThumbnailSeekSec(5, 99), 4.95);
  assert.equal(clampThumbnailSeekSec(5, -1), 0);
});

test("escapeDrawtext neutralizes ffmpeg metacharacters", () => {
  const out = escapeDrawtext("Crack: 100% 'wow'");
  assert.ok(!out.includes("'"));
  assert.match(out, /Crack\\:/);
  assert.match(out, /100\\%/);
});
