export function hasOpenAI(): boolean {
  return Boolean(process.env.OPENAI_API_KEY?.trim());
}

export function hasAyrshare(): boolean {
  return Boolean(process.env.AYRSHARE_API_KEY?.trim());
}

/** Public origin for media URLs sent to Ayrshare (must be reachable). */
export function appBaseUrl(): string {
  return (
    process.env.APP_BASE_URL?.replace(/\/$/, "") ??
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ??
    "http://localhost:3000"
  );
}

export function openAIModel(): string {
  return process.env.OPENAI_COPY_MODEL ?? "gpt-4o-mini";
}

export function storageDriverEnv(): "local" | "s3" {
  return process.env.STORAGE_DRIVER === "s3" ? "s3" : "local";
}

export function hasS3Config(): boolean {
  return Boolean(process.env.AWS_S3_BUCKET?.trim() && s3Region());
}

export function s3Region(): string {
  return process.env.AWS_REGION ?? process.env.AWS_DEFAULT_REGION ?? "us-east-1";
}

export function s3CloudFrontDomain(): string | undefined {
  const d = process.env.AWS_CLOUDFRONT_DOMAIN?.trim();
  return d || undefined;
}

export function jobExecutor(): "inline" | "worker" {
  return process.env.JOB_EXECUTOR === "worker" ? "worker" : "inline";
}

export function remotionRenderMode(): "off" | "local" | "lambda" {
  const v = process.env.REMOTION_RENDER?.toLowerCase();
  if (v === "local" || v === "lambda") return v;
  return "off";
}

/** When true, API routes require x-spinesync-api-key or session cookie (default: production). */
export function requireApiKey(): boolean {
  const v = process.env.SPINESYNC_REQUIRE_API_KEY?.trim().toLowerCase();
  if (v === "true" || v === "1") return true;
  if (v === "false" || v === "0") return false;
  return process.env.NODE_ENV === "production";
}

export function isHttpsAppBaseUrl(base = appBaseUrl()): boolean {
  try {
    const url = new URL(base);
    return url.protocol === "https:";
  } catch {
    return false;
  }
}

/** Ayrshare live posts require a public HTTPS origin for media URLs. */
export function canPublishToAyrshare(): boolean {
  return hasAyrshare() && isHttpsAppBaseUrl();
}

export function jobQueueBackend(): "sqlite" | "redis" {
  return process.env.JOB_QUEUE_BACKEND === "redis" ? "redis" : "sqlite";
}
