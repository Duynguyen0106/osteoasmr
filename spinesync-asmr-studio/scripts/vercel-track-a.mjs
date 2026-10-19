#!/usr/bin/env node
/**
 * Track A helpers: Vercel env sync, deploy trigger, production status.
 *
 * Usage:
 *   VERCEL_TOKEN=... node scripts/vercel-track-a.mjs status
 *   VERCEL_TOKEN=... node scripts/vercel-track-a.mjs sync-env [.env.vercel.production]
 *   VERCEL_TOKEN=... node scripts/vercel-track-a.mjs deploy
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { randomBytes } from "node:crypto";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const appRoot = path.resolve(__dirname, "..");

function loadProjectMeta() {
  const projectFile = path.join(appRoot, ".vercel", "project.json");
  if (!fs.existsSync(projectFile)) {
    throw new Error(
      `Missing ${projectFile}. Run \`npx vercel link\` from spinesync-asmr-studio.`,
    );
  }
  return JSON.parse(fs.readFileSync(projectFile, "utf8"));
}

function token() {
  const t = process.env.VERCEL_TOKEN?.trim();
  if (!t) throw new Error("Set VERCEL_TOKEN (Vercel → Account → Tokens).");
  return t;
}

async function vercelFetch(pathname, init = {}) {
  const res = await fetch(`https://api.vercel.com${pathname}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token()}`,
      "Content-Type": "application/json",
      ...init.headers,
    },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = body?.error?.message ?? res.statusText;
    throw new Error(`${pathname}: ${msg}`);
  }
  return body;
}

function parseEnvFile(filePath) {
  const text = fs.readFileSync(filePath, "utf8");
  /** @type {Record<string, string>} */
  const out = {};
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    out[key] = value;
  }
  return out;
}

const TRACK_A_KEYS = [
  "NEXT_PUBLIC_PIPELINE_MODE",
  "SPINESYNC_DATA_ROOT",
  "STORAGE_DRIVER",
  "AWS_REGION",
  "AWS_S3_BUCKET",
  "AWS_ACCESS_KEY_ID",
  "AWS_SECRET_ACCESS_KEY",
  "AWS_CLOUDFRONT_DOMAIN",
  "SPINESYNC_SESSION_SECRET",
  "SPINESYNC_MEDIA_TOKEN_SECRET",
  "APP_BASE_URL",
  "SPINESYNC_DEFAULT_API_KEY",
  "SPINESYNC_REQUIRE_API_KEY",
  "OPENAI_API_KEY",
  "AYRSHARE_API_KEY",
];

function ensureGeneratedSecrets(vars) {
  const next = { ...vars };
  if (!next.SPINESYNC_SESSION_SECRET?.trim()) {
    next.SPINESYNC_SESSION_SECRET = randomBytes(32).toString("hex");
    console.log("Generated SPINESYNC_SESSION_SECRET");
  }
  if (!next.SPINESYNC_MEDIA_TOKEN_SECRET?.trim()) {
    next.SPINESYNC_MEDIA_TOKEN_SECRET = randomBytes(32).toString("hex");
    console.log("Generated SPINESYNC_MEDIA_TOKEN_SECRET");
  }
  if (!next.STORAGE_DRIVER?.trim()) next.STORAGE_DRIVER = "blob";
  if (!next.NEXT_PUBLIC_PIPELINE_MODE?.trim()) {
    next.NEXT_PUBLIC_PIPELINE_MODE = "server";
  }
  if (!next.SPINESYNC_DATA_ROOT?.trim()) {
    next.SPINESYNC_DATA_ROOT = "/tmp/spinesync";
  }
  return next;
}

async function syncEnv(fileArg) {
  const filePath = path.resolve(
    appRoot,
    fileArg ?? ".env.vercel.production",
  );
  const { projectId } = loadProjectMeta();
  /** @type {Record<string, string>} */
  let vars;
  if (fs.existsSync(filePath)) {
    vars = ensureGeneratedSecrets(parseEnvFile(filePath));
  } else if (process.argv[3] === "--minimal") {
    vars = ensureGeneratedSecrets({
      STORAGE_DRIVER: "blob",
      APP_BASE_URL: "https://spinesync-asmr-studio.vercel.app",
      NEXT_PUBLIC_PIPELINE_MODE: "server",
      SPINESYNC_DATA_ROOT: "/tmp/spinesync",
    });
  } else {
    throw new Error(
      `Create ${filePath} from .env.vercel.production.example, or run: npm run vercel:sync-env -- --minimal`,
    );
  }

  const driver = (vars.STORAGE_DRIVER ?? "blob").toLowerCase();
  if (driver === "s3") {
    const missing = ["AWS_S3_BUCKET", "AWS_ACCESS_KEY_ID", "AWS_SECRET_ACCESS_KEY"].filter(
      (k) => !vars[k]?.trim(),
    );
    if (missing.length) {
      throw new Error(`Missing required values for S3: ${missing.join(", ")}`);
    }
  }

  await upsertProjectEnv(projectId, vars);

  console.log("\nEnv sync done. Redeploy production for changes to apply:");
  console.log("  npm run vercel:deploy");
}

async function upsertProjectEnv(projectId, vars) {
  const existing = await vercelFetch(
    `/v9/projects/${projectId}/env?decrypt=false`,
  );
  const byKey = new Map((existing.envs ?? []).map((e) => [e.key, e]));
  const targets = ["production", "preview", "development"];

  for (const key of TRACK_A_KEYS) {
    const value = vars[key];
    if (value === undefined || value === "") continue;

    const prev = byKey.get(key);
    if (prev) {
      await vercelFetch(`/v9/projects/${projectId}/env/${prev.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          value,
          target: targets,
          type: "encrypted",
        }),
      });
      console.log(`Updated ${key}`);
    } else {
      await vercelFetch(`/v9/projects/${projectId}/env`, {
        method: "POST",
        body: JSON.stringify({
          key,
          value,
          type: "encrypted",
          target: targets,
        }),
      });
      console.log(`Created ${key}`);
    }
  }
}

const DEPLOY_HOOK_URL =
  process.env.VERCEL_DEPLOY_HOOK_URL ??
  "https://api.vercel.com/v1/integrations/deploy/prj_zCuRuTgw5fQaksTLY9DsJqwJFKts/mWwPQxbbmh";

async function deployProduction() {
  const productionUrl =
    process.env.PRODUCTION_URL ?? "https://spinesync-asmr-studio.vercel.app";

  try {
    const hookRes = await fetch(DEPLOY_HOOK_URL, { method: "POST" });
    const hookBody = await hookRes.json().catch(() => ({}));
    if (hookRes.ok) {
      console.log(JSON.stringify({ via: "deploy-hook", ...hookBody }, null, 2));
      return;
    }
    console.warn(`Deploy hook failed (${hookRes.status}), falling back to git deploy API…`);
  } catch (err) {
    console.warn(`Deploy hook error: ${err instanceof Error ? err.message : err}`);
  }

  const { projectId, orgId } = loadProjectMeta();
  const project = await vercelFetch(
    `/v9/projects/${projectId}${orgId ? `?teamId=${orgId}` : ""}`,
  );
  const repoId = project.link?.repoId;
  if (!repoId) throw new Error("Project is not linked to a GitHub repo.");

  const ref = project.link?.productionBranch ?? "main";
  const shaRes = await fetch(
    `https://api.github.com/repos/${project.link.org}/${project.link.repo}/commits/${ref}`,
    {
      headers: {
        Accept: "application/vnd.github+json",
        "User-Agent": "spinesync-track-a",
      },
    },
  );
  if (!shaRes.ok) {
    throw new Error(`Could not resolve ${ref} SHA from GitHub (${shaRes.status}).`);
  }
  const commit = await shaRes.json();

  try {
    const deployment = await vercelFetch(
      `/v13/deployments${orgId ? `?teamId=${orgId}` : ""}`,
      {
        method: "POST",
        body: JSON.stringify({
          name: project.name,
          project: projectId,
          target: "production",
          gitSource: {
            type: "github",
            repoId,
            ref,
            sha: commit.sha,
          },
        }),
      },
    );
    console.log(JSON.stringify({ via: "git-api", ...deployment }, null, 2));
  } catch (err) {
    if (String(err.message).includes("api-deployments-free-per-day")) {
      console.error(err.message);
      console.error(
        `\nDaily deploy quota exhausted. Use the deploy hook or Vercel dashboard → Deployments → Redeploy (Git, not CLI).\n  PRODUCTION_URL=${productionUrl}`,
      );
      process.exit(1);
    }
    throw err;
  }
}

async function status() {
  const { projectId, orgId } = loadProjectMeta();
  const productionUrl =
    process.env.PRODUCTION_URL ?? "https://spinesync-asmr-studio.vercel.app";

  const [project, envRes, depRes, healthRes] = await Promise.all([
    vercelFetch(`/v9/projects/${projectId}${orgId ? `?teamId=${orgId}` : ""}`),
    vercelFetch(`/v9/projects/${projectId}/env?decrypt=false`),
    vercelFetch(
      `/v6/deployments?projectId=${projectId}&limit=5${orgId ? `&teamId=${orgId}` : ""}`,
    ),
    fetch(`${productionUrl.replace(/\/$/, "")}/api/health`, {
      headers: { Accept: "application/json" },
    }),
  ]);

  const envKeys = (envRes.envs ?? []).map((e) => e.key).sort();
  const usesBlob =
    envKeys.includes("BLOB_READ_WRITE_TOKEN") ||
    (await vercelFetch(`/v9/projects/${projectId}/env?decrypt=false`))
      .envs?.some((e) => e.key === "STORAGE_DRIVER");
  const required = usesBlob
    ? [
        "STORAGE_DRIVER",
        "BLOB_READ_WRITE_TOKEN",
        "SPINESYNC_SESSION_SECRET",
        "SPINESYNC_MEDIA_TOKEN_SECRET",
      ]
    : [
        "STORAGE_DRIVER",
        "AWS_S3_BUCKET",
        "AWS_REGION",
        "AWS_ACCESS_KEY_ID",
        "AWS_SECRET_ACCESS_KEY",
        "SPINESYNC_SESSION_SECRET",
        "SPINESYNC_MEDIA_TOKEN_SECRET",
      ];
  const envMissing = required.filter((k) => !envKeys.includes(k));

  /** @type {Record<string, unknown>} */
  let health = {};
  let healthStale = false;
  if (healthRes.ok) {
    health = await healthRes.json();
    healthStale = !("hosting" in health) || !("pipelineBlockers" in health);
  }

  const deployments = (depRes.deployments ?? []).map((d) => ({
    readyState: d.readyState,
    errorMessage: d.errorMessage ?? null,
    sha: d.meta?.githubCommitSha ?? null,
    created: d.created,
    url: d.url,
  }));

  console.log(
    JSON.stringify(
      {
        productionUrl,
        project: {
          rootDirectory: project.rootDirectory,
          productionBranch: project.link?.productionBranch,
        },
        vercelEnvKeys: envKeys,
        vercelEnvMissing: envMissing,
        liveProductionHealth: health,
        liveHealthLooksStale: healthStale,
        recentDeployments: deployments,
      },
      null,
      2,
    ),
  );

  if (healthStale) {
    console.error(
      "\nNote: Live /api/health is missing Track A fields (hosting, pipelineBlockers). Production is likely on an old deployment — redeploy main after env is set.",
    );
  }
  if (envMissing.length) {
    console.error(
      `\nMissing Vercel env: ${envMissing.join(", ")}. Run: npm run vercel:sync-env`,
    );
  }
}

const cmd = process.argv[2];
try {
  if (cmd === "status") await status();
  else if (cmd === "sync-env") await syncEnv(process.argv[3]);
  else if (cmd === "deploy") await deployProduction();
  else {
    console.error(`Usage: node scripts/vercel-track-a.mjs <status|sync-env|deploy>`);
    process.exit(1);
  }
} catch (err) {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
}
