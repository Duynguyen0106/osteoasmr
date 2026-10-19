import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultReelEdit } from "@/lib/contract/reel-edit";
import {
  clipDurationSec,
  normalizeReelEdit,
  timelineToSourceTime,
} from "@/lib/reel-edit/normalize";

test("normalizeReelEdit clamps trim window", () => {
  const edit = normalizeReelEdit(
    {
      ...defaultReelEdit(10),
      trimInSec: 8,
      trimOutSec: 12,
    },
    10,
  );
  assert.ok(edit.trimInSec < edit.trimOutSec!);
  assert.ok(edit.trimOutSec! <= 10);
});

test("clipDurationSec matches trim span", () => {
  const edit = normalizeReelEdit(
    { ...defaultReelEdit(20), trimInSec: 2, trimOutSec: 8 },
    20,
  );
  assert.equal(clipDurationSec(edit), 6);
});

test("timelineToSourceTime maps clip to source", () => {
  const edit = normalizeReelEdit(
    { ...defaultReelEdit(20), trimInSec: 3, trimOutSec: 13 },
    20,
  );
  assert.equal(timelineToSourceTime(edit, 2), 5);
});
