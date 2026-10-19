/** Vercel / platform max duration for serverless functions (seconds). */
export function parseMaxFunctionDurationSec(): number | null {
  const raw =
    process.env.VERCEL_MAX_DURATION?.trim() ??
    process.env.MAX_DURATION?.trim();
  if (raw) {
    const n = Number.parseInt(raw, 10);
    if (Number.isFinite(n) && n > 0) return n;
  }
  return process.env.VERCEL === "1" ? 60 : null;
}
