import { createHmac, timingSafeEqual } from "crypto";

const DEFAULT_TTL_SEC = 3600;

function mediaSecret(): string {
  return (
    process.env.SPINESYNC_MEDIA_TOKEN_SECRET?.trim() ??
    process.env.SPINESYNC_SESSION_SECRET?.trim() ??
    "spinesync_dev_media_token"
  );
}

function sign(relativePath: string, exp: number): string {
  return createHmac("sha256", mediaSecret())
    .update(`${relativePath}:${exp}`)
    .digest("base64url");
}

export function createMediaToken(relativePath: string, ttlSec = DEFAULT_TTL_SEC): {
  exp: number;
  sig: string;
} {
  const exp = Math.floor(Date.now() / 1000) + ttlSec;
  return { exp, sig: sign(relativePath, exp) };
}

export function verifyMediaToken(
  relativePath: string,
  exp: number,
  sig: string,
): boolean {
  if (!Number.isFinite(exp) || exp < Math.floor(Date.now() / 1000)) return false;
  const expected = sign(relativePath, exp);
  try {
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    return a.length === b.length && timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export function signedMediaPath(relativePath: string, ttlSec?: number): string {
  const { exp, sig } = createMediaToken(relativePath, ttlSec);
  const q = new URLSearchParams({ exp: String(exp), sig });
  return `/api/media/${relativePath}?${q.toString()}`;
}

export function absoluteSignedMediaUrl(
  baseUrl: string,
  relativePath: string,
  ttlSec?: number,
): string {
  const path = signedMediaPath(relativePath, ttlSec);
  return `${baseUrl.replace(/\/$/, "")}${path}`;
}
