# SpineSync ASMR Studio — Feature Audit (2026)

## Product shape

Single-page **automation studio** for osteopathic 9:16 ASMR reels: ingest → sculpt → pipeline → export → social. **Mock mode** (default) simulates stages; **server mode** runs SQLite, ffmpeg, Whisper, optional OpenAI/Ayrshare.

## What is production-ready

| Area | Status |
|------|--------|
| Upload + peak (Web Audio / ffmpeg) | ✅ |
| Live ASMR preview (EQ + crack WAV) | ✅ |
| Server pipeline (EQ, Whisper, reel, thumb, copy) | ✅ with ffmpeg + S3 on Vercel |
| Job history, SSE logs, signed exports | ✅ server mode |
| Ops panels (S3, worker, Remotion, integrations) | ✅ |
| **Reel Pro Editor (v1)** | ✅ trim, peak, captions, zoom → job `edit` payload |

## Gaps vs full NLE (Premiere / CapCut class)

- No multi-clip timeline or B-roll tracks
- No keyframed effect stacks (zoom is peak-scalar only)
- No frame-accurate caption drag on timeline (text edit only)
- No collaborative review / version branches
- Full re-render still runs pipeline (no incremental render graph)

## Reel Pro Editor architecture

- **UI:** `components/editor/ReelProEditor.tsx`, `TimelineMultiTrack.tsx`
- **State:** `hooks/useReelEditor.ts`, `lib/contract/reel-edit.ts`
- **Server:** `lib/server/source-trim.ts`, `edit` on `CreateJobBody`, pipeline trim + caption override

See `docs/ASMR-SOUND.md` for audio chain details.
