import type { StudioView } from "@/components/layout/StudioViewTabs";

export const STUDIO_HOME_PATH = "/";
export const STUDIO_EDITOR_PATH = "/editor";

export function jobEditPath(jobId: string): string {
  return `/jobs/${encodeURIComponent(jobId)}/edit`;
}

export function studioPathForView(
  view: StudioView,
  options?: { jobId?: string | null },
): string {
  if (view === "editor" && options?.jobId) {
    return jobEditPath(options.jobId);
  }
  if (view === "editor") return STUDIO_EDITOR_PATH;
  return STUDIO_HOME_PATH;
}

export function parseJobIdFromEditPath(pathname: string): string | null {
  const match = /^\/jobs\/([^/]+)\/edit\/?$/.exec(pathname);
  if (!match?.[1]) return null;
  try {
    return decodeURIComponent(match[1]);
  } catch {
    return match[1];
  }
}
