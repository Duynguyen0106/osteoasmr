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
