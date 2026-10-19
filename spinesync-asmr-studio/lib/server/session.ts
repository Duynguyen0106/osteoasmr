import { createHmac, timingSafeEqual } from "crypto";
import { getDefaultProjectId } from "./auth";

const COOKIE_NAME = "spinesync_session";
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

function sessionSecret(): string {
  const fromEnv = process.env.SPINESYNC_SESSION_SECRET?.trim();
  if (fromEnv) return fromEnv;
  return "spinesync_dev_session_secret_change_me";
}

function signPayload(payload: string): string {
  return createHmac("sha256", sessionSecret()).update(payload).digest("base64url");
}

export function createSessionCookieValue(projectId: string): string {
  const exp = Date.now() + SESSION_TTL_MS;
  const payload = `${projectId}.${exp}`;
  return `${payload}.${signPayload(payload)}`;
}

export function parseSessionCookie(
  cookieHeader: string | null,
): { projectId: string } | null {
  if (!cookieHeader) return null;
  const match = cookieHeader
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${COOKIE_NAME}=`));
  if (!match) return null;
  const value = decodeURIComponent(match.slice(COOKIE_NAME.length + 1));
  const parts = value.split(".");
  if (parts.length !== 3) return null;
  const [projectId, expStr, sig] = parts;
  const exp = Number(expStr);
  if (!projectId || !Number.isFinite(exp) || !sig) return null;
  if (exp < Date.now()) return null;

  const payload = `${projectId}.${expStr}`;
  const expected = signPayload(payload);
  try {
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  } catch {
    return null;
  }

  return { projectId };
}

export function sessionCookieHeader(projectId: string): string {
  const value = createSessionCookieValue(projectId);
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${COOKIE_NAME}=${encodeURIComponent(value)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${Math.floor(SESSION_TTL_MS / 1000)}${secure}`;
}

export function defaultBootstrapProjectId(): string {
  return getDefaultProjectId();
}
