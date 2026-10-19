const API_KEY_STORAGE = "spinesync_api_key";

export function getStoredApiKey(): string | null {
  if (typeof window === "undefined") return null;
  return window.sessionStorage.getItem(API_KEY_STORAGE);
}

export function setStoredApiKey(key: string) {
  window.sessionStorage.setItem(API_KEY_STORAGE, key);
}

export async function ensureStudioSession() {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const apiKey = getStoredApiKey();
  if (apiKey) headers["x-spinesync-api-key"] = apiKey;

  await fetch("/api/auth/bootstrap", {
    method: "POST",
    credentials: "include",
    headers,
    body: JSON.stringify(apiKey ? { apiKey } : {}),
  });
}

export async function spinesyncFetch(
  input: RequestInfo | URL,
  init: RequestInit = {},
): Promise<Response> {
  const headers = new Headers(init.headers);
  const apiKey = getStoredApiKey();
  if (apiKey && !headers.has("x-spinesync-api-key")) {
    headers.set("x-spinesync-api-key", apiKey);
  }
  return fetch(input, { ...init, headers, credentials: "include" });
}
