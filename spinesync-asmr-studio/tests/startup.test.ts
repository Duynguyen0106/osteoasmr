import assert from "node:assert/strict";
import test from "node:test";
import {
  shouldEnforceProductionSecrets,
  validateProductionSecrets,
} from "../lib/server/startup";

test("shouldEnforceProductionSecrets skips npm run build", () => {
  const prev = process.env.npm_lifecycle_event;
  process.env.NODE_ENV = "production";
  process.env.npm_lifecycle_event = "build";
  assert.equal(shouldEnforceProductionSecrets(), false);
  process.env.npm_lifecycle_event = prev;
});

test("validateProductionSecrets throws on default session secret in production runtime", () => {
  const prev = {
    nodeEnv: process.env.NODE_ENV,
    session: process.env.SPINESYNC_SESSION_SECRET,
    media: process.env.SPINESYNC_MEDIA_TOKEN_SECRET,
    skip: process.env.SPINESYNC_SKIP_SECRET_VALIDATION,
    lifecycle: process.env.npm_lifecycle_event,
  };

  process.env.NODE_ENV = "production";
  process.env.npm_lifecycle_event = "start";
  process.env.SPINESYNC_SKIP_SECRET_VALIDATION = undefined;
  process.env.SPINESYNC_SESSION_SECRET = "spinesync_dev_session_secret_change_me";
  process.env.SPINESYNC_MEDIA_TOKEN_SECRET = "custom-media-secret";

  assert.throws(() => validateProductionSecrets(), /SPINESYNC_SESSION_SECRET/);

  process.env.NODE_ENV = prev.nodeEnv;
  process.env.SPINESYNC_SESSION_SECRET = prev.session;
  process.env.SPINESYNC_MEDIA_TOKEN_SECRET = prev.media;
  process.env.SPINESYNC_SKIP_SECRET_VALIDATION = prev.skip;
  process.env.npm_lifecycle_event = prev.lifecycle;
});
