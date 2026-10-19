import assert from "node:assert/strict";
import { test } from "node:test";
import { incrementalThumbFileName } from "@/lib/server/incremental-thumb";

test("incrementalThumbFileName is stable and headline-sensitive", () => {
  const a = incrementalThumbFileName("CRACK RELEASE");
  const b = incrementalThumbFileName("CRACK RELEASE");
  const c = incrementalThumbFileName("OTHER HEADLINE");
  assert.equal(a, b);
  assert.match(a, /^thumb-[a-f0-9]{10}\.jpg$/);
  assert.notEqual(a, c);
});

test("incrementalThumbFileName trims empty to default headline hash", () => {
  const empty = incrementalThumbFileName("   ");
  const explicit = incrementalThumbFileName("SPINESYNC ASMR");
  assert.equal(empty, explicit);
});
