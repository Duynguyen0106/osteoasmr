"use client";

import { useEffect, useRef } from "react";
import type { ReelEditState } from "@/lib/contract/reel-edit";
import {
  loadPersistedReelEdit,
  reelEditStorageKeyPrimary,
  savePersistedReelEdit,
} from "@/lib/reel-edit/persist";

const SAVE_DEBOUNCE_MS = 450;

export function useReelEditPersistence(options: {
  assetId: string | null;
  file: File | null;
  sourceDurationSec: number;
  reelEdit: ReelEditState | null;
  onRestore: (edit: ReelEditState) => void;
  onRestoredLog?: () => void;
}) {
  const {
    assetId,
    file,
    sourceDurationSec,
    reelEdit,
    onRestore,
    onRestoredLog,
  } = options;

  const restoreTargetRef = useRef<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const primary = reelEditStorageKeyPrimary({ assetId, file });
    if (!primary) {
      restoreTargetRef.current = null;
      return;
    }
    if (restoreTargetRef.current === primary) return;
    restoreTargetRef.current = primary;

    const loaded = loadPersistedReelEdit(
      window.localStorage,
      { assetId, file },
      sourceDurationSec,
    );
    if (loaded) {
      onRestore(loaded);
      onRestoredLog?.();
    }
  }, [
    assetId,
    file?.name,
    file?.size,
    file?.lastModified,
    sourceDurationSec,
    onRestore,
    onRestoredLog,
  ]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!reelEdit) return;
    const primary = reelEditStorageKeyPrimary({ assetId, file });
    if (!primary) return;

    const handle = window.setTimeout(() => {
      savePersistedReelEdit(
        window.localStorage,
        { assetId, file },
        reelEdit,
        sourceDurationSec,
      );
    }, SAVE_DEBOUNCE_MS);

    return () => window.clearTimeout(handle);
  }, [reelEdit, assetId, file, sourceDurationSec]);
}
