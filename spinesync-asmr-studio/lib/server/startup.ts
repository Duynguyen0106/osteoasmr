const DEV_SESSION_FALLBACK = "spinesync_dev_session_secret_change_me";
const DEV_MEDIA_FALLBACK = "spinesync_dev_media_token";

export function shouldEnforceProductionSecrets(): boolean {
  if (process.env.NODE_ENV !== "production") return false;
  if (
    process.env.SPINESYNC_SKIP_SECRET_VALIDATION === "1" ||
    process.env.SPINESYNC_SKIP_SECRET_VALIDATION === "true"
  ) {
    return false;
  }
  if (process.env.npm_lifecycle_event === "build") return false;
  return true;
}

export function validateProductionSecrets(): void {
  if (!shouldEnforceProductionSecrets()) return;

  const session = process.env.SPINESYNC_SESSION_SECRET?.trim();
  if (!session) {
    throw new Error(
      "SPINESYNC_SESSION_SECRET is required in production (runtime). Set SPINESYNC_SKIP_SECRET_VALIDATION=1 only for local production builds.",
    );
  }
  if (session === DEV_SESSION_FALLBACK) {
    throw new Error(
      "SPINESYNC_SESSION_SECRET must not use the development default in production.",
    );
  }

  const media =
    process.env.SPINESYNC_MEDIA_TOKEN_SECRET?.trim() ??
    process.env.SPINESYNC_SESSION_SECRET?.trim();
  if (!media || media === DEV_MEDIA_FALLBACK) {
    throw new Error(
      "Set SPINESYNC_MEDIA_TOKEN_SECRET (or a non-default SPINESYNC_SESSION_SECRET) for signed media URLs in production.",
    );
  }
}
