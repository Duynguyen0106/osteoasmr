import assert from "node:assert/strict";
import test from "node:test";
import { isHttpsAppBaseUrl } from "../lib/server/config";

test("isHttpsAppBaseUrl accepts https origins", () => {
  assert.equal(isHttpsAppBaseUrl("https://studio.example.com"), true);
  assert.equal(isHttpsAppBaseUrl("http://localhost:3000"), false);
});
