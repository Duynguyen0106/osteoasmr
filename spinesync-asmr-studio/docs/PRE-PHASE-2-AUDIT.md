# Pre–Phase 2 Audit — SpineSync ASMR Studio v2.5

**Date:** 2026-10-19  
**Branch audited:** `cursor/reel-editor-pro-abcc` (PR [#7](https://github.com/Duynguyen0106/osteoasmr/pull/7))  
**Production `main`:** still at CI/Vercel fix merge — **editor + audit gaps not merged yet**

---

## 1. Executive summary

| Verdict | Detail |
|--------|--------|
| **Automation studio** | Solid for ingest → ASMR sculpt → ffmpeg pipeline → exports (server mode + S3 on Vercel). |
| **Reel Pro Editor v1** | Usable for trim, manual peak, zoom intensity, caption **text** override; wired to `POST /api/jobs` via `edit`. |
| **Ready for Phase 2?** | **Yes, with caveats** — merge stacked PRs first, fix P0 editor/pipeline gaps below, then start Phase 2 on a clean `main`. |

Phase 2 should **not** add tracks/features on top of unresolved v1 parity issues (captions vs trim, mock mode, duration ruler).

---

## 2. Repository / release state

| Item | Status |
|------|--------|
| Open PRs | #3–#5 (draft, subset of stack), #6 (full audit gaps), **#7 (editor + full stack)** |
| Recommended merge | **#7 only** (supersedes #3–#6), then close duplicates |
| Tests (branch) | 23 unit + 4 integration — pass |
| Deploy | Not verified on Vercel this sprint; quota/history applies |

---

## 3. Product matrix (mock vs server)

| Capability | Mock | Server |
|------------|------|--------|
| Upload + live ASMR preview | ✅ | ✅ |
| Reel Pro Editor UI | ✅ (preview trim) | ✅ |
| **`edit` applied on Run Pipeline** | ❌ **Not passed** — mock run ignores trim/peak/captions | ✅ |
| Whisper / reel / exports | Simulated | Real (ffmpeg + S3) |
| Job history rehydrates edit | ❌ | ❌ (config in `config_json` but UI does not reload) |

**Action before Phase 2:** Mock pipeline should either pass `edit` into logs + fake stage messages, or show a clear banner: *“Edits apply only in server mode.”*

---

## 4. Reel Pro Editor v1 — what works

| Feature | UI | Server export |
|---------|----|--------------|
| Trim in/out (source ruler) | ✅ | ✅ `source-trim.mp4` when window narrows |
| Manual peak | ✅ | ✅ on trimmed timeline |
| Peak zoom intensity | ✅ | ✅ `renderReel916` zoom scale |
| Caption text edit | ✅ | ✅ skips Whisper when `edit.captions` set |
| Markers (M shortcut) | ✅ stored in state | ❌ **not used** in pipeline |
| Undo/redo | ✅ in-memory | N/A |
| Keyboard I/O, J/L | ✅ | N/A |
| Preview respects trim | ✅ `VerticalReelPlayer` + `reelEdit` | N/A |

**Architecture (keep for Phase 2):**

- Contract: `lib/contract/reel-edit.ts` → `CreateJobBody.edit`
- Normalize: `lib/reel-edit/normalize.ts`
- Trim: `lib/server/source-trim.ts`
- UI: `ReelProEditor`, `TimelineMultiTrack`, `useReelEditor`

---

## 5. P0 gaps (fix before or in first Phase 2 sprint)

### 5.1 Caption timebase vs trim

- Whisper segments are **0-based on processed (trimmed) audio** after a fresh export.
- In the editor, caption blocks are drawn at `trimInSec + segment.start` on the **source** ruler.
- If segments came from a **previous full-length** job and the user trims, **positions are wrong** until re-transcribe or shift logic is added.

**Phase 2 prerequisite:** On trim change, either re-run Whisper on trimmed clip only, or transform segment times relative to `trimInSec`.

### 5.2 Source duration for timeline

- `sourceDurationSec` uses **Web Audio decode length**, not `video.duration`.
- Long video + short decode edge cases can skew ruler and trim clamps.

**Fix:** Prefer `HTMLVideoElement.duration` when `previewVideoUrl` is available.

### 5.3 `reelEdit` initialization

- `reelEdit` is `null` until `ReelProEditor` mounts and `onEditChange` fires.
- Pipeline still safe (defaults via `defaultReelEdit(sourceDurationSec)` on run).
- User who never opens Editor tab never gets intentional peak override from UI (auto peak only).

**Low priority:** Initialize edit when upload completes.

### 5.4 Markers dead end

- `markers[]` in schema and UI, **no pipeline consumer**.
- Either wire (chapter points, cut list) or hide from v1 UX to avoid false expectations.

### 5.5 No automated test for `edit` → pipeline

- Unit tests cover `normalizeReelEdit` only.
- Missing: integration test that POST job with `edit` validates Zod and optionally mocks ffmpeg.

---

## 6. P1 gaps (platform / ops — from prior audit)

Still true on this branch:

- Vercel: inline jobs vs **timeout** — worker + Redis + external host documented in ops panels.
- Durable artifacts require **S3** on ephemeral hosts.
- Remotion Lambda env falls back to ffmpeg.
- Long jobs: `JOB_EXECUTOR=worker` + `npm run worker:pipeline`.

---

## 7. Phase 2 scope (recommended order)

Do **not** treat these as parallel — sequence reduces rework:

| Priority | Theme | Outcome |
|----------|--------|---------|
| **2.1** | **Caption timeline** | Drag start/end on timeline; timebase rules with trim; optional re-Whisper |
| **2.2** | **Edit persistence** | Save `edit` per `assetId` / job; reload from Job History |
| **2.3** | **Duration + sync** | Video metadata ruler; mock-mode edit messaging |
| **2.4** | **B-roll / overlay track** | Second video lane, ffmpeg compositor |
| **2.5** | **Routing** | `/editor` or `/jobs/[id]/edit` deep link |
| **2.6** | **Incremental preview** | Partial ffmpeg preview without full 6-stage run |

Explicitly **out of scope** for Phase 2 unless product asks: multi-user review, full keyframe NLE, Remotion Studio embed.

---

## 8. Phase 2 entry checklist

- [ ] Merge **PR #7** (+ pre-phase-2 checklist branch) to `main`
- [ ] Smoke: upload → Editor → trim + peak → server pipeline → reel matches trim
- [x] Fix **P0.1** caption/trim timebase — `lib/reel-edit/captions.ts`, pipeline export filter
- [x] Fix **P0.2** video duration on ruler — `onSourceDurationSec` from preview video metadata
- [x] Mock mode banner + edit-aware mock pipeline logs
- [x] Markers — logged on pipeline run (reference); not rendered in export yet
- [x] Unit tests for `edit` Zod payload + caption trim (`job-edit-schema`, `captions-trim`)
- [x] CI uses `test:unit` only (integration SIGSEGV on Actions)
- [x] Job history restores `edit` from GET `/api/jobs/:id`

When merge + smoke are checked, start Phase 2.1 (caption timeline drag).

---

## 9. Related docs

- `docs/FEATURE-AUDIT.md` — high-level product vs NLE
- `docs/ASMR-SOUND.md` — audio / crack / export chain
