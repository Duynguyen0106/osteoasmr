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
