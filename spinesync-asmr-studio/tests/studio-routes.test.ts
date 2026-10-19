import assert from "node:assert/strict";
import { test } from "node:test";
import {
  jobEditPath,
  parseJobIdFromEditPath,
  studioPathForView,
} from "@/lib/studio-routes";

test("jobEditPath encodes job id", () => {
  assert.equal(jobEditPath("abc-123"), "/jobs/abc-123/edit");
});

test("studioPathForView maps views", () => {
  assert.equal(studioPathForView("pipeline"), "/");
  assert.equal(studioPathForView("editor"), "/editor");
  assert.equal(studioPathForView("editor", { jobId: "j1" }), "/jobs/j1/edit");
});

test("parseJobIdFromEditPath round-trips", () => {
  assert.equal(parseJobIdFromEditPath("/jobs/abc/edit"), "abc");
  assert.equal(parseJobIdFromEditPath("/"), null);
});
