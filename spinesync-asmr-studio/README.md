# SpineSync ASMR Studio v2.4

Dark medical-tech dashboard for osteopathic ASMR video automation: ingest MP4/MOV, run a six-stage pipeline, preview 9:16 reels, peak analytics, copywriter output, and social dispatch.

## Stack

- Next.js 16 (App Router) + TypeScript + Tailwind CSS v4
- **Backend (Phase A):** SQLite (`.data/spinesync.db`), local disk storage, **ffmpeg** workers, **SSE** job streaming
- Optional **mock mode** (client-only simulation, no API)

## Pipeline modes

| Mode | Env | Behavior |
|------|-----|----------|
| **server** | `NEXT_PUBLIC_PIPELINE_MODE=server` | Real jobs via `/api/*`, ffmpeg render, SSE terminal |
| **mock** | unset or `mock` | In-browser simulated pipeline (original demo) |

Copy `.env.example` to `.env.local` for server mode. Requires **ffmpeg** on `PATH`.

## API (server mode)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | ffmpeg + storage status |
| POST | `/api/assets/upload` | Multipart `file` → `{ assetId }` |
| POST | `/api/jobs` | Create job (JSON body, see `lib/contract/job.ts`) |
| GET | `/api/jobs/:id` | Status, stages, logs, result |
| GET | `/api/jobs/:id/stream` | SSE log/stage/complete events |
| POST | `/api/jobs/:id/publish` | Mock Ayrshare dispatch + terminal logs |
| GET | `/api/media/*` | Serve job artifacts (reel, thumb, etc.) |

Artifacts live under `.data/uploads/` (gitignored).

## Project layout

| Path | Role |
|------|------|
| `app/api/` | BFF route handlers |
| `lib/server/` | DB, storage, ffmpeg, pipeline runner, SSE bus |
| `lib/contract/` | Zod job/publish schemas (shared) |
| `components/StudioDashboard.tsx` | Mock vs server pipeline switch |
| `hooks/usePipelineServer.ts` | SSE client + job lifecycle |

See prior component map under `components/`, `hooks/`, `lib/`.

## Run locally

```bash
npm install
cp .env.example .env.local   # optional: enable server mode
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

- `npm run dev` — development server
- `npm run build` — production build
- `npm run lint` — ESLint

## Server pipeline stages

1. **eq** — peak scan (ffmpeg volumedetect windows) + EQ wav  
2. **whisper** — **OpenAI Whisper** when `OPENAI_API_KEY` set; else fallback VTT + `segments.json`  
3. **remotion** — ffmpeg 9:16 H.264 with optional **burned captions** + EQ audio + micro-zoom (ffmpeg fallback if complex filter fails)  
4. **thumbnail** — frame at detected peak  
5. **gpt** — **GPT-4o / gpt-4o-mini** JSON copy when OpenAI configured; else templates  
6. **dispatch** — `publish.json`; **Ayrshare POST** when `AYRSHARE_API_KEY` + public `APP_BASE_URL`  

### Phase B env vars

| Variable | Purpose |
|----------|---------|
| `OPENAI_API_KEY` | Whisper transcription + GPT copy |
| `OPENAI_COPY_MODEL` | Default `gpt-4o-mini` |
| `AYRSHARE_API_KEY` | Live social dispatch |
| `APP_BASE_URL` | Public URL for `mediaUrls` (required for Ayrshare to fetch reel) |

UI karaoke subtitles use `captionSegments` from completed jobs when available.
