import assert from "node:assert/strict";
import { test } from "node:test";
import { hasS3Config } from "@/lib/server/config";

test("hasS3Config requires bucket, region, and IAM keys", () => {
  const prev = {
    AWS_S3_BUCKET: process.env.AWS_S3_BUCKET,
    AWS_REGION: process.env.AWS_REGION,
    AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
    AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
  };
  try {
    delete process.env.AWS_S3_BUCKET;
    delete process.env.AWS_REGION;
    delete process.env.AWS_ACCESS_KEY_ID;
    delete process.env.AWS_SECRET_ACCESS_KEY;
    assert.equal(hasS3Config(), false);

    process.env.AWS_S3_BUCKET = "b";
    process.env.AWS_REGION = "us-east-1";
    assert.equal(hasS3Config(), false);

    process.env.AWS_ACCESS_KEY_ID = "AKIA";
    process.env.AWS_SECRET_ACCESS_KEY = "secret";
    assert.equal(hasS3Config(), true);
  } finally {
    for (const [k, v] of Object.entries(prev)) {
      if (v === undefined) delete process.env[k];
      else process.env[k] = v;
    }
  }
});
