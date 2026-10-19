# SpineSync ASMR Studio — Feature Audit (2026)

## Product shape

Single-page **automation studio** for osteopathic 9:16 ASMR reels: ingest → sculpt → pipeline → export → social. **Mock mode** (default) simulates stages; **server mode** runs SQLite, ffmpeg, Whisper, optional OpenAI/Ayrshare.

## What is production-ready

| Area | Status |
|------|--------|
| Upload + peak (Web Audio / ffmpeg) | ✅ |
| Live ASMR preview (EQ + crack WAV) | ✅ |
| Server pipeline (EQ, Whisper, reel, GPT copy, branded thumb) | ✅ with ffmpeg + S3 on Vercel |
| Quick ffmpeg preview + quick thumbnail APIs | ✅ server mode |
| Job history, SSE logs, signed exports | ✅ server mode |
| Ops panels (S3, worker, Remotion, integrations) | ✅ |
| **Reel Pro Editor (Phase 2)** | ✅ trim, peak, captions, B-roll, zoom, `thumbTimeSec`, edit persistence |
| Routing `/editor`, `/jobs/:id/edit` | ✅ |
| Ayrshare publish with reel + YouTube/X thumb when HTTPS media | ✅ when `AYRSHARE_API_KEY` + `APP_BASE_URL` |

## Remaining gaps vs full NLE (Premiere / CapCut class)

- No multi-clip primary timeline (single source + B-roll overlays only)
- No keyframed effect stacks (zoom is peak-scalar only)
- Caption timeline drag/resize is v1 (no word-level karaoke edit in UI)
- No collaborative review / version branches
- Full export still runs the six-stage pipeline (incremental preview is ffmpeg-only subset)

## Key architecture

- **Editor UI:** `ReelProEditor`, `TimelineMultiTrack`, `CaptionTimelineTrack`, `BrollTimelineTrack`
- **State:** `useReelEditor`, `reel-edit` contract, `localStorage` persistence
- **Server:** `source-trim`, B-roll composite, `incremental-preview` / `incremental-thumb`, `pipeline-runner`
- **Thumbnail:** `thumbnail-render`, GPT headline burn-in, Ayrshare `thumbNail` on publish

See `docs/PRE-PHASE-2-AUDIT.md` for Phase 2 checklist history and `docs/THUMBNAIL.md` for thumb phases A–D.
