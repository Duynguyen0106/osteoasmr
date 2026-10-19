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

Both **osteoasmr** and **spinesync-asmr-studio** Vercel projects can build from this repo. Root [`vercel.json`](./vercel.json) runs install/build inside `spinesync-asmr-studio/`.

For **spinesync-asmr-studio** (recommended production app), set Vercel **Root Directory** = `spinesync-asmr-studio`. Production URL: https://spinesync-asmr-studio.vercel.app

If GitHub Vercel checks fail (rate limits or duplicate projects), open Vercel → **spinesync-asmr-studio** → Deployments → **Redeploy** on latest `main`.

Set production secrets in Vercel: `SPINESYNC_SESSION_SECRET`, `SPINESYNC_MEDIA_TOKEN_SECRET`, and optionally `SPINESYNC_DEFAULT_API_KEY`.
