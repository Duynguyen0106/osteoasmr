import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import {
  assertJobAccess,
  assertMediaAccess,
  resolveProjectFromRequest,
} from "../lib/server/access";
import { ensureDefaultProject } from "../lib/server/auth";
import { createJobRecord } from "../lib/server/job-service";
import { resetDbForTests } from "../lib/server/db";

function withEnv(
  overrides: Record<string, string | undefined>,
  fn: () => void | Promise<void>,
) {
  const previous: Record<string, string | undefined> = {};
  for (const key of Object.keys(overrides)) {
    previous[key] = process.env[key];
    const value = overrides[key];
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
  return Promise.resolve(fn()).finally(() => {
    for (const key of Object.keys(overrides)) {
      const value = previous[key];
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  });
}

function tempDataRoot() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "spinesync-test-"));
}

test("strict auth rejects job access without session or API key", async () => {
  const dataRoot = tempDataRoot();
  await withEnv(
    {
      SPINESYNC_DATA_ROOT: dataRoot,
      SPINESYNC_REQUIRE_API_KEY: "true",
      SPINESYNC_SESSION_SECRET: "test-session-secret-32chars-min",
      NODE_ENV: "production",
      SPINESYNC_SKIP_SECRET_VALIDATION: "1",
    },
    () => {
      resetDbForTests();
      ensureDefaultProject();
      const jobId = createJobRecord(
        {
          focus: "neck",
          eqBoost: 50,
          toggles: { autoPeakZoom: true, sfxCrack: false, tiktokSubs: true },
          sourceLabel: "test",
        },
        ensureDefaultProject().id,
      );

      const req = new Request("http://localhost/api/jobs/" + jobId);
      const access = assertJobAccess(req, jobId);
      assert.ok("error" in access);
      assert.equal(access.error?.status, 401);
    },
  );
});

test("media path without token or auth returns unauthorized", async () => {
  await withEnv(
    {
      SPINESYNC_REQUIRE_API_KEY: "true",
      NODE_ENV: "production",
      SPINESYNC_SKIP_SECRET_VALIDATION: "1",
    },
    () => {
      resetDbForTests();
      const req = new Request(
        "http://localhost/api/media/jobs/fake-job-id/reel.mp4",
      );
      const denied = assertMediaAccess(req, "jobs/fake-job-id/reel.mp4");
      assert.ok(denied);
      assert.equal(denied.status, 401);
    },
  );
});

test("bootstrap returns 401 in strict mode without credentials", async () => {
  await withEnv(
    {
      SPINESYNC_REQUIRE_API_KEY: "true",
      NODE_ENV: "production",
      SPINESYNC_SKIP_SECRET_VALIDATION: "1",
    },
    async () => {
      resetDbForTests();
      const { bootstrapAuthSession } = await import(
        "../lib/server/bootstrap-session"
      );
      const result = await bootstrapAuthSession(
        new Request("http://localhost/api/auth/bootstrap", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: "{}",
        }),
      );
      assert.equal(result.status, 401);
    },
  );
});

test("lenient mode resolves default project", async () => {
  await withEnv(
    {
      SPINESYNC_REQUIRE_API_KEY: "false",
      NODE_ENV: "development",
    },
    () => {
      resetDbForTests();
      const projectId = resolveProjectFromRequest(
        new Request("http://localhost/api/health"),
      );
      assert.ok(projectId);
      assert.match(projectId!, /^proj_/);
    },
  );
});
