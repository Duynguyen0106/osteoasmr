import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultReelEdit } from "@/lib/contract/reel-edit";
import {
  captionsForTrimmedExport,
  clipCaptionsToSource,
  importCaptionsForEditor,
} from "@/lib/reel-edit/captions";
import { normalizeReelEdit } from "@/lib/reel-edit/normalize";

test("clipCaptionsToSource offsets by trim in", () => {
  const out = clipCaptionsToSource(
    [{ start: 0, end: 2, text: "hi" }],
    5,
  );
  assert.equal(out[0].start, 5);
  assert.equal(out[0].end, 7);
});

test("captionsForTrimmedExport filters and shifts to clip time", () => {
  const edit = normalizeReelEdit(
    { ...defaultReelEdit(20), trimInSec: 4, trimOutSec: 14 },
    20,
  );
  const exportCaps = captionsForTrimmedExport(
    [
      { start: 1, end: 2, text: "drop" },
      { start: 6, end: 8, text: "keep" },
    ],
    edit,
  );
  assert.equal(exportCaps?.length, 1);
  assert.equal(exportCaps![0].text, "keep");
  assert.equal(exportCaps![0].start, 2);
});

test("importCaptionsForEditor promotes clip-relative job captions", () => {
  const edit = normalizeReelEdit(
    { ...defaultReelEdit(30), trimInSec: 10, trimOutSec: 25 },
    30,
  );
  const imported = importCaptionsForEditor(
    [{ start: 0, end: 3, text: "line" }],
    edit,
    30,
  );
  assert.equal(imported?.[0].start, 10);
});
