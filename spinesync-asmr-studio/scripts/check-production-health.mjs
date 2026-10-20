#!/usr/bin/env node
/**
 * Track A gate: production /api/health must report pipelineReady.
 * Usage: PRODUCTION_URL=https://spinesync-asmr-studio.vercel.app node scripts/check-production-health.mjs
 */

const base = (process.env.PRODUCTION_URL ?? "https://spinesync-asmr-studio.vercel.app")
  .replace(/\/$/, "");

const homeRes = await fetch(`${base}/`, {
  headers: { Accept: "text/html" },
});
const homeHtml = await homeRes.text();
if (!homeRes.ok || homeHtml.includes("__next_error__")) {
  console.error(
    `FAIL · Home page HTTP ${homeRes.status} or Next error shell at ${base}/`,
  );
  process.exit(1);
}
if (!homeHtml.includes("SpineSync ASMR")) {
  console.error(`FAIL · Home page missing studio shell at ${base}/`);
  process.exit(1);
}

const res = await fetch(`${base}/api/health`, {
  headers: { Accept: "application/json" },
});

if (!res.ok) {
  console.error(`FAIL · HTTP ${res.status} from ${base}/api/health`);
  process.exit(1);
}

/** @type {Record<string, unknown>} */
const health = await res.json();

const staleDeploy =
  !("hosting" in health) || !Array.isArray(health.pipelineBlockers);

const ffmpeg = health.ffmpeg === true;
const pipelineReady = health.hosting?.pipelineReady === true;
const blockers = Array.isArray(health.pipelineBlockers)
  ? health.pipelineBlockers
  : [];

console.log(JSON.stringify(health, null, 2));

if (pipelineReady && ffmpeg && blockers.length === 0 && !staleDeploy) {
  console.log("\nOK · Track A health gate passed");
  process.exit(0);
}

console.error("\nFAIL · Track A health gate");
if (staleDeploy) {
  console.error(
    "  - production is on a stale deployment (missing hosting/pipelineBlockers) — redeploy main after Vercel env is set",
  );
}
if (!ffmpeg) console.error("  - ffmpeg is not available");
if (!pipelineReady) console.error("  - hosting.pipelineReady is false");
for (const b of blockers) console.error(`  - ${b}`);
console.error("\nSee docs/PRODUCTION-GO-LIVE.md for Vercel env setup.");
process.exit(1);
