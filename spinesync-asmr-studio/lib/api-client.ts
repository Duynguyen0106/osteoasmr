const API_KEY_STORAGE = "spinesync_api_key";

export function getStoredApiKey(): string | null {
  if (typeof window === "undefined") return null;
  return window.sessionStorage.getItem(API_KEY_STORAGE);
}

export function setStoredApiKey(key: string) {
  window.sessionStorage.setItem(API_KEY_STORAGE, key);
}

let sessionBootstrapPromise: Promise<boolean> | null = null;

function apiPath(input: RequestInfo | URL): string | null {
  if (typeof input === "string") {
    if (input.startsWith("/api/")) return input;
    try {
      const url = new URL(input, "http://localhost");
      return url.pathname.startsWith("/api/") ? url.pathname : null;
    } catch {
      return null;
    }
  }
  if (input instanceof URL) {
    return input.pathname.startsWith("/api/") ? input.pathname : null;
  }
  return null;
}

/** Mint HttpOnly session cookie (or validate API key). Dedupes concurrent calls. */
export async function ensureStudioSession(): Promise<boolean> {
  if (typeof window === "undefined") return false;

  if (sessionBootstrapPromise) {
    return sessionBootstrapPromise;
  }

  sessionBootstrapPromise = (async () => {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    const apiKey = getStoredApiKey();
    if (apiKey) headers["x-spinesync-api-key"] = apiKey;

    try {
      const res = await fetch("/api/auth/bootstrap", {
        method: "POST",
        credentials: "include",
        headers,
        body: JSON.stringify(apiKey ? { apiKey } : {}),
      });
      return res.ok;
    } catch {
      return false;
    }
  })().finally(() => {
    sessionBootstrapPromise = null;
  });

  return sessionBootstrapPromise;
}

export async function spinesyncFetch(
  input: RequestInfo | URL,
  init: RequestInit = {},
): Promise<Response> {
  const path = apiPath(input);
  if (
    path &&
    path !== "/api/auth/bootstrap" &&
    typeof window !== "undefined"
  ) {
    await ensureStudioSession();
  }

  const headers = new Headers(init.headers);
  const apiKey = getStoredApiKey();
  if (apiKey && !headers.has("x-spinesync-api-key")) {
    headers.set("x-spinesync-api-key", apiKey);
  }
  return fetch(input, { ...init, headers, credentials: "include" });
}

/** @internal Test hook */
export function resetSessionBootstrapForTests() {
  sessionBootstrapPromise = null;
}
