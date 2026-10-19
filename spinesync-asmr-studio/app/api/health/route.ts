import { NextResponse } from "next/server";
import { execFile } from "child_process";
import { promisify } from "util";
import { appBaseUrl, hasAyrshare, hasOpenAI } from "@/lib/server/config";

const execFileAsync = promisify(execFile);

export async function GET() {
  let ffmpeg = false;
  try {
    await execFileAsync("ffmpeg", ["-version"]);
    ffmpeg = true;
  } catch {
    ffmpeg = false;
  }

  return NextResponse.json({
    ok: true,
    ffmpeg,
    storage: "local",
    database: "sqlite",
    integrations: {
      openai: hasOpenAI(),
      ayrshare: hasAyrshare(),
      appBaseUrl: appBaseUrl(),
    },
  });
}
