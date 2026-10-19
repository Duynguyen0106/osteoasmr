import { connection } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { ensureDefaultProject, resolveProjectIdOrNull } from "@/lib/server/auth";
import { requireApiKey } from "@/lib/server/config";
import { sessionCookieHeader } from "@/lib/server/session";

const bodySchema = z.object({
  apiKey: z.string().optional(),
});

export async function POST(request: Request) {
  await connection();
  ensureDefaultProject();

  let projectId = ensureDefaultProject().id;
  const json = await request.json().catch(() => ({}));
  const parsed = bodySchema.safeParse(json);

  const headerKey = request.headers.get("x-spinesync-api-key");
  const apiKey = parsed.success ? parsed.data.apiKey?.trim() : undefined;

  if (headerKey || apiKey) {
    const key = headerKey ?? apiKey!;
    const fromKey = resolveProjectIdOrNull(
      new Request(request.url, { headers: { "x-spinesync-api-key": key } }),
    );
    if (!fromKey) {
      return NextResponse.json({ error: "Invalid API key" }, { status: 401 });
    }
    projectId = fromKey;
  } else if (requireApiKey()) {
    return NextResponse.json(
      { error: "API key required to start session" },
      { status: 401 },
    );
  }

  return NextResponse.json(
    { ok: true, projectId },
    {
      headers: {
        "Set-Cookie": sessionCookieHeader(projectId),
      },
    },
  );
}
