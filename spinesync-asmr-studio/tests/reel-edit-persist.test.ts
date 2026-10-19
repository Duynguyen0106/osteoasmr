import assert from "node:assert/strict";
import { test } from "node:test";
import type { ReelEditState } from "@/lib/contract/reel-edit";
import {
  loadPersistedReelEdit,
  parsePersistedReelEdit,
  reelEditStorageKeyPrimary,
  reelEditStorageKeys,
  savePersistedReelEdit,
  serializeReelEdit,
} from "@/lib/reel-edit/persist";

function memoryStorage(): Storage {
  const map = new Map<string, string>();
  return {
    get length() {
      return map.size;
    },
    clear() {
      map.clear();
    },
    getItem(key: string) {
      return map.get(key) ?? null;
    },
    key(index: number) {
      return [...map.keys()][index] ?? null;
    },
    removeItem(key: string) {
      map.delete(key);
    },
    setItem(key: string, value: string) {
      map.set(key, value);
    },
  };
}

const sampleEdit: ReelEditState = {
  trimInSec: 2,
  trimOutSec: 10,
  peakTimeSec: 3,
  zoomIntensity: 90,
  markers: [],
  brollOverlays: [],
  captions: [{ start: 0.5, end: 2, text: "hello" }],
};

test("reelEditStorageKeys prefers asset and file keys", () => {
  const keys = reelEditStorageKeys({
    assetId: "abc",
    file: { name: "x.mp4", size: 100, lastModified: 1 },
  });
  assert.equal(keys.length, 2);
  assert.match(keys[0], /:asset:abc$/);
  assert.match(keys[1], /:file:x\.mp4:100:1$/);
});

test("reelEditStorageKeyPrimary uses asset when present", () => {
  const key = reelEditStorageKeyPrimary({
    assetId: "abc",
    file: { name: "x.mp4", size: 1, lastModified: 1 },
  });
  assert.match(key ?? "", /:asset:abc$/);
});

test("serialize and parse round-trip", () => {
  const raw = serializeReelEdit(sampleEdit);
  const loaded = parsePersistedReelEdit(raw, 12);
  assert.deepEqual(loaded?.trimInSec, 2);
  assert.equal(loaded?.captions?.[0]?.text, "hello");
});

test("save writes both keys and load reads asset first", () => {
  const storage = memoryStorage();
  savePersistedReelEdit(
    storage,
    {
      assetId: "id1",
      file: { name: "a.mp4", size: 5, lastModified: 9 },
    },
    sampleEdit,
    12,
  );
  const assetKey = reelEditStorageKeyPrimary({ assetId: "id1" });
  assert.ok(assetKey && storage.getItem(assetKey));

  const loaded = loadPersistedReelEdit(
    storage,
    { assetId: "id1", file: null },
    12,
  );
  assert.equal(loaded?.trimInSec, 2);
});

test("save removes storage when edit is default-only", () => {
  const storage = memoryStorage();
  const target = {
    assetId: "id2",
    file: null as File | null,
  };
  savePersistedReelEdit(storage, target, sampleEdit, 12);
  savePersistedReelEdit(
    storage,
    target,
    {
      trimInSec: 0,
      trimOutSec: 12,
      peakTimeSec: null,
      zoomIntensity: 100,
      markers: [],
      brollOverlays: [],
    },
    12,
  );
  assert.equal(storage.getItem(reelEditStorageKeyPrimary(target) ?? ""), null);
});
