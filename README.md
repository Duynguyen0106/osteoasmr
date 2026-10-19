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

Both **osteoasmr** and **spinesync-asmr-studio** Vercel projects should build from this repo. Root [`vercel.json`](./vercel.json) sets `"rootDirectory": "spinesync-asmr-studio"` so production deploys run the Next.js app instead of an empty root build.

Set production secrets in Vercel: `SPINESYNC_SESSION_SECRET`, `SPINESYNC_MEDIA_TOKEN_SECRET`, and optionally `SPINESYNC_DEFAULT_API_KEY`.
