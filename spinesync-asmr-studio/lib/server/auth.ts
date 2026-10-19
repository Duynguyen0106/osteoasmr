import { eq } from "drizzle-orm";
import { getDb, schema } from "./db";

export function getDefaultProjectId(): string {
  return "proj_spinesync_default";
}

export function ensureDefaultProject() {
  const db = getDb();
  const existing = db
    .select()
    .from(schema.projects)
    .where(eq(schema.projects.id, getDefaultProjectId()))
    .get();
  if (existing) return existing;

  const apiKey =
    process.env.SPINESYNC_DEFAULT_API_KEY?.trim() ??
    `sk_local_${crypto.randomUUID().replace(/-/g, "")}`;

  const row = {
    id: getDefaultProjectId(),
    name: "SpineSync Default",
    apiKey,
    createdAt: new Date(),
  };
  db.insert(schema.projects).values(row).run();
  return row;
}

export function resolveProjectId(request: Request): string {
  const resolved = resolveProjectIdOrNull(request);
  return resolved ?? getDefaultProjectId();
}

export function resolveProjectIdOrNull(request: Request): string | null {
  ensureDefaultProject();
  const headerKey = request.headers.get("x-spinesync-api-key");
  if (headerKey) {
    const db = getDb();
    const project = db
      .select()
      .from(schema.projects)
      .where(eq(schema.projects.apiKey, headerKey))
      .get();
    if (project) return project.id;
    return null;
  }
  return getDefaultProjectId();
}

export function getProjectApiKey(projectId: string): string | null {
  const db = getDb();
  const project = db
    .select()
    .from(schema.projects)
    .where(eq(schema.projects.id, projectId))
    .get();
  return project?.apiKey ?? null;
}
