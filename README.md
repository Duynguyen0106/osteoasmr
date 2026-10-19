# osteoasmr

Monorepo root for osteopathic ASMR automation experiments.

## Apps

### [SpineSync ASMR Studio](./spinesync-asmr-studio)

Next.js dashboard for ingest, simulated AI pipeline, 9:16 preview, copywriter, and social dispatch UI.

```bash
cd spinesync-asmr-studio
npm install
npm run dev
```

See [spinesync-asmr-studio/README.md](./spinesync-asmr-studio/README.md) for component map and scripts.

## Vercel (monorepo)

Both **osteoasmr** and **spinesync-asmr-studio** Vercel projects should build from this repo. Root [`vercel.json`](./vercel.json) runs `npm ci` / `npm run build` inside `spinesync-asmr-studio/` so root deploys are not empty (which caused `NOT_FOUND` on `osteoasmr.vercel.app`).

For the **spinesync-asmr-studio** Vercel project, keep **Root Directory** = `spinesync-asmr-studio` in the dashboard (uses `spinesync-asmr-studio/vercel.json` only).

Set production secrets in Vercel: `SPINESYNC_SESSION_SECRET`, `SPINESYNC_MEDIA_TOKEN_SECRET`, and optionally `SPINESYNC_DEFAULT_API_KEY`.
