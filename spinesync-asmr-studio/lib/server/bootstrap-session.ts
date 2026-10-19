import { z } from "zod";
import { ensureDefaultProject, resolveProjectIdOrNull } from "@/lib/server/auth";
import { requireApiKey } from "@/lib/server/config";
import { sessionCookieHeader } from "@/lib/server/session";

const bodySchema = z.object({
  apiKey: z.string().optional(),
});

export async function bootstrapAuthSession(request: Request): Promise<{
  status: number;
  body: Record<string, unknown>;
  setCookie?: string;
}> {
  ensureDefaultProject();

  let projectId = ensureDefaultProject().id;
  const json = await request.json().catch(() => ({}));
  const parsed = bodySchema.safeParse(json);

  const headerKey = request.headers.get("x-spinesync-api-key");
  const apiKey = parsed.success ? parsed.data.apiKey?.trim() : undefined;

  const envDefaultKey = process.env.SPINESYNC_DEFAULT_API_KEY?.trim();

  if (headerKey || apiKey) {
    const key = headerKey ?? apiKey!;
    const fromKey = resolveProjectIdOrNull(
      new Request(request.url, { headers: { "x-spinesync-api-key": key } }),
    );
    if (!fromKey) {
      return { status: 401, body: { error: "Invalid API key" } };
    }
    projectId = fromKey;
  } else if (requireApiKey()) {
    if (envDefaultKey) {
      const fromEnv = resolveProjectIdOrNull(
        new Request(request.url, {
          headers: { "x-spinesync-api-key": envDefaultKey },
        }),
      );
      if (fromEnv) {
        projectId = fromEnv;
      } else {
        return {
          status: 401,
          body: { error: "Invalid SPINESYNC_DEFAULT_API_KEY on server" },
        };
      }
    } else {
      return {
        status: 401,
        body: { error: "API key required to start session" },
      };
    }
  }

  return {
    status: 200,
    body: { ok: true, projectId },
    setCookie: sessionCookieHeader(projectId),
  };
}
