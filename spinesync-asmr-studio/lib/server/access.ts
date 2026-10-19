import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDefaultProjectId, resolveProjectIdOrNull } from "./auth";
import { getDb, schema } from "./db";
import { parseSessionCookie } from "./session";
import { verifyMediaToken } from "./media-token";
import { requireApiKey } from "./config";

export function resolveProjectFromRequest(request: Request): string | null {
  const headerKey = request.headers.get("x-spinesync-api-key");
  const cookieProject = parseSessionCookie(request.headers.get("cookie"));

  if (headerKey) {
    const fromHeader = resolveProjectIdOrNull(request);
    if (!fromHeader) return null;
    return fromHeader;
  }

  if (cookieProject) return cookieProject.projectId;

  if (requireApiKey()) return null;
  return getDefaultProjectId();
}

export function unauthorized(message = "Unauthorized") {
  return NextResponse.json({ error: message }, { status: 401 });
}

export function forbidden(message = "Forbidden") {
  return NextResponse.json({ error: message }, { status: 403 });
}

function resourceProjectId(stored: string | null | undefined): string {
  return stored ?? getDefaultProjectId();
}

export function assertAssetAccess(request: Request, assetId: string) {
  const projectId = resolveProjectFromRequest(request);
  if (!projectId) return { error: unauthorized() as NextResponse };

  const asset = getDb()
    .select()
    .from(schema.assets)
    .where(eq(schema.assets.id, assetId))
    .get();
  if (!asset) {
    return { error: NextResponse.json({ error: "Asset not found" }, { status: 404 }) };
  }
  if (resourceProjectId(asset.projectId) !== projectId) {
    return { error: forbidden("Asset belongs to another project") };
  }
  return { projectId, asset };
}

export function assertJobAccess(request: Request, jobId: string) {
  const projectId = resolveProjectFromRequest(request);
  if (!projectId) return { error: unauthorized() as NextResponse };

  const job = getDb()
    .select()
    .from(schema.jobs)
    .where(eq(schema.jobs.id, jobId))
    .get();
  if (!job) {
    return { error: NextResponse.json({ error: "Job not found" }, { status: 404 }) };
  }
  if (resourceProjectId(job.projectId) !== projectId) {
    return { error: forbidden("Job belongs to another project") };
  }
  return { projectId, job };
}

export function assertMediaAccess(
  request: Request,
  relativePath: string,
): NextResponse | null {
  const url = new URL(request.url);
  const exp = Number(url.searchParams.get("exp"));
  const sig = url.searchParams.get("sig") ?? "";
  if (verifyMediaToken(relativePath, exp, sig)) {
    return null;
  }

  const projectId = resolveProjectFromRequest(request);
  if (!projectId) return unauthorized();

  const jobsMatch = /^jobs\/([^/]+)\//.exec(relativePath);
  if (jobsMatch) {
    const jobId = jobsMatch[1];
    const job = getDb()
      .select()
      .from(schema.jobs)
      .where(eq(schema.jobs.id, jobId))
      .get();
    if (!job) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    if (resourceProjectId(job.projectId) !== projectId) {
      return forbidden();
    }
    return null;
  }

  const assetsMatch = /^projects\/([^/]+)\//.exec(relativePath);
  if (assetsMatch) {
    if (assetsMatch[1] !== projectId) return forbidden();
    return null;
  }

  return forbidden("Media path not allowed");
}
