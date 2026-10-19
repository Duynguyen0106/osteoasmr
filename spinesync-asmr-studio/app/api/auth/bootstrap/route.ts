import { connection } from "next/server";
import { NextResponse } from "next/server";
import { bootstrapAuthSession } from "@/lib/server/bootstrap-session";

export async function POST(request: Request) {
  await connection();
  const result = await bootstrapAuthSession(request);
  const headers: Record<string, string> = {};
  if (result.setCookie) headers["Set-Cookie"] = result.setCookie;
  return NextResponse.json(result.body, { status: result.status, headers });
}
