# Track A — Production go-live (Vercel)

Use this checklist to turn **spinesync-asmr-studio** from a UI demo into a working server pipeline on Vercel.

## Hobby plan (≤12 serverless functions)

API routes are consolidated (`/api/preview`, `/api/assets`, publish via `POST /api/jobs/:id`) so the app fits Vercel Hobby’s function limit.

## 1. Vercel project settings

| Setting | Value |
|---------|--------|
| **Root Directory** | `spinesync-asmr-studio` |
| **Production branch** | `main` |
| **Framework** | Next.js (auto) |

Prefer **one** Vercel project (`spinesync-asmr-studio`) linked to this repo. Disable or disconnect the duplicate **osteoasmr** root project to avoid double deploys and rate limits.

## 2. Required environment variables

Set in Vercel → Project → Settings → Environment Variables (**Production** + **Preview** as needed).

**CLI (recommended):** copy `.env.vercel.production.example` → `.env.vercel.production`, fill AWS values, then:

```bash
cd spinesync-asmr-studio
VERCEL_TOKEN=... npm run vercel:sync-env
VERCEL_TOKEN=... npm run vercel:deploy   # or redeploy from Vercel dashboard
VERCEL_TOKEN=... npm run vercel:status   # env keys + deployment errors + live health
```

Hobby accounts may hit **100 deploys/day**; if deploy fails, wait for quota reset or use **Deployments → Redeploy** once in the dashboard.

### Core (required on Vercel)

| Variable | Example / notes |
|----------|-----------------|
| `NEXT_PUBLIC_PIPELINE_MODE` | `server` (also in `vercel.json`) |
| `SPINESYNC_DATA_ROOT` | `/tmp/spinesync` (ephemeral SQLite + cache) |
| `STORAGE_DRIVER` | `s3` |
| `AWS_REGION` | `us-east-1` |
| `AWS_S3_BUCKET` | your bucket |
| `AWS_ACCESS_KEY_ID` | IAM user or role key |
| `AWS_SECRET_ACCESS_KEY` | IAM secret |

See [S3-PRODUCTION-SETUP.md](./S3-PRODUCTION-SETUP.md) for bucket + IAM policy.
| `SPINESYNC_SESSION_SECRET` | long random string |
| `SPINESYNC_MEDIA_TOKEN_SECRET` | long random string |
| `APP_BASE_URL` | `https://spinesync-asmr-studio.vercel.app` (or custom domain, **HTTPS**) |

Optional but recommended:

| Variable | Purpose |
|----------|---------|
| `AWS_CLOUDFRONT_DOMAIN` | Public media URLs for Ayrshare / downloads |
| `SPINESYNC_DEFAULT_API_KEY` | Dev API key seed (rotate in prod) |
| `SPINESYNC_REQUIRE_API_KEY` | `true` in production (default) |

### Integrations (optional)

| Variable | Purpose |
|----------|---------|
| `OPENAI_API_KEY` | GPT copy + Whisper |
| `OPENAI_COPY_MODEL` | e.g. `gpt-4o-mini` |
| `AYRSHARE_API_KEY` | Live social publish |

## 3. Verify after deploy

```bash
cd spinesync-asmr-studio
npm run check:production
# or: PRODUCTION_URL=https://your-app.vercel.app npm run check:production
```

**Success criteria** (`GET /api/health`):

- `ffmpeg: true`
- `hosting.durableStorage: true`
- `hosting.pipelineReady: true`
- `pipelineBlockers: []`

## 4. Manual smoke (production)

After health is green:

1. Open app → session bootstrap / API key if required.
2. Upload a short MP4 → wait for server analyze peak.
3. Reel Pro Editor → trim → **Run pipeline** → SSE completes.
4. Download **reel** + **thumb** from exports.
5. Optional: **Quick ffmpeg preview** and **Quick thumbnail** before full run.
6. Optional: **Publish** with Ayrshare when keys + HTTPS media URLs are set.

Record results in `docs/PRE-PHASE-2-AUDIT.md` §8 checkboxes.

## 5. Long renders

Vercel `maxDuration` is raised in `vercel.json` for job/preview routes (Pro plan may be required for >60s). For heavy workloads:

- `JOB_EXECUTOR=worker` + `JOB_QUEUE_BACKEND=redis` + `REDIS_URL`
- Run `npm run worker:pipeline` on a VM with ffmpeg + S3.

## 6. Troubleshooting

| Symptom | Fix |
|---------|-----|
| `ffmpeg: false`, error “binary missing” | Redeploy after `outputFileTracingIncludes` in `next.config.ts`; or set `FFMPEG_PATH` / `FFPROBE_PATH` |
| `pipelineReady: false`, local storage on Vercel | Set `STORAGE_DRIVER=s3` and AWS vars |
| GitHub “Deployment rate limited” | Wait 24h or redeploy once from Vercel dashboard |
| Pipeline starts then times out | Worker + Redis, or shorter source clip |
