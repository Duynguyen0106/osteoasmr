import { reelEditSchema, type ReelEditState } from "@/lib/contract/reel-edit";
import { hasMeaningfulEdit } from "@/lib/reel-edit/edit-diff";
import { normalizeReelEdit } from "@/lib/reel-edit/normalize";

export const REEL_EDIT_STORAGE_VERSION = 1;
const PREFIX = `spinesync.reelEdit.v${REEL_EDIT_STORAGE_VERSION}`;

export type ReelEditPersistTarget = {
  assetId?: string | null;
  file?: Pick<File, "name" | "size" | "lastModified"> | null;
};

export function reelEditStorageKeys(target: ReelEditPersistTarget): string[] {
  const keys: string[] = [];
  if (target.assetId) {
    keys.push(`${PREFIX}:asset:${target.assetId}`);
  }
  if (target.file) {
    const { name, size, lastModified } = target.file;
    keys.push(`${PREFIX}:file:${name}:${size}:${lastModified}`);
  }
  return keys;
}

export function reelEditStorageKeyPrimary(
  target: ReelEditPersistTarget,
): string | null {
  if (target.assetId) return `${PREFIX}:asset:${target.assetId}`;
  if (target.file) {
    const { name, size, lastModified } = target.file;
    return `${PREFIX}:file:${name}:${size}:${lastModified}`;
  }
  return null;
}

type StoredPayload = {
  v: number;
  savedAt: number;
  edit: ReelEditState;
};

export function parsePersistedReelEdit(
  raw: string,
  sourceDurationSec: number,
): ReelEditState | null {
  try {
    const parsed = JSON.parse(raw) as StoredPayload;
    if (parsed.v !== REEL_EDIT_STORAGE_VERSION || !parsed.edit) return null;
    const edit = reelEditSchema.parse(parsed.edit);
    return normalizeReelEdit(edit, sourceDurationSec);
  } catch {
    return null;
  }
}

export function serializeReelEdit(edit: ReelEditState): string {
  const payload: StoredPayload = {
    v: REEL_EDIT_STORAGE_VERSION,
    savedAt: Date.now(),
    edit,
  };
  return JSON.stringify(payload);
}

export type ReelEditStorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;

export function loadPersistedReelEdit(
  storage: ReelEditStorageLike,
  target: ReelEditPersistTarget,
  sourceDurationSec: number,
): ReelEditState | null {
  for (const key of reelEditStorageKeys(target)) {
    const raw = storage.getItem(key);
    if (!raw) continue;
    const edit = parsePersistedReelEdit(raw, sourceDurationSec);
    if (edit && hasMeaningfulEdit(edit, sourceDurationSec)) return edit;
  }
  return null;
}

export function savePersistedReelEdit(
  storage: ReelEditStorageLike,
  target: ReelEditPersistTarget,
  edit: ReelEditState,
  sourceDurationSec: number,
): void {
  const normalized = normalizeReelEdit(edit, sourceDurationSec);
  const keys = reelEditStorageKeys(target);
  if (!keys.length) return;

  if (!hasMeaningfulEdit(normalized, sourceDurationSec)) {
    for (const key of keys) storage.removeItem(key);
    return;
  }

  const raw = serializeReelEdit(normalized);
  for (const key of keys) storage.setItem(key, raw);
}
