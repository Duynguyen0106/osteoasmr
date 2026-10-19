import { NextResponse } from "next/server";
import { execFile } from "child_process";
import { promisify } from "util";

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
  });
}
