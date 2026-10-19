import assert from "node:assert/strict";
import { test } from "node:test";
import { parseMaxFunctionDurationSec } from "@/lib/server/hosting-hints";

test("parseMaxFunctionDurationSec reads VERCEL_MAX_DURATION", () => {
  const prev = process.env.VERCEL_MAX_DURATION;
  process.env.VERCEL_MAX_DURATION = "120";
  delete process.env.VERCEL;
  try {
    assert.equal(parseMaxFunctionDurationSec(), 120);
  } finally {
    if (prev === undefined) delete process.env.VERCEL_MAX_DURATION;
    else process.env.VERCEL_MAX_DURATION = prev;
  }
});

test("parseMaxFunctionDurationSec defaults on Vercel", () => {
  const prevV = process.env.VERCEL;
  const prevM = process.env.VERCEL_MAX_DURATION;
  process.env.VERCEL = "1";
  delete process.env.VERCEL_MAX_DURATION;
  delete process.env.MAX_DURATION;
  try {
    assert.equal(parseMaxFunctionDurationSec(), 60);
  } finally {
    if (prevV === undefined) delete process.env.VERCEL;
    else process.env.VERCEL = prevV;
    if (prevM === undefined) delete process.env.VERCEL_MAX_DURATION;
    else process.env.VERCEL_MAX_DURATION = prevM;
  }
});
