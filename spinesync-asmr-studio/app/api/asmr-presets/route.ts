import { NextResponse } from "next/server";
import { asmrPresetPayloadSchema } from "@/lib/contract/asmr-preset";
import {
  createAsmrPreset,
  listAsmrPresets,
} from "@/lib/server/asmr-preset-service";
import { resolveProjectFromRequest, unauthorized } from "@/lib/server/access";

export async function GET(request: Request) {
  const projectId = resolveProjectFromRequest(request);
  if (!projectId) return unauthorized();
  return NextResponse.json({ presets: listAsmrPresets(projectId) });
}

export async function POST(request: Request) {
  const projectId = resolveProjectFromRequest(request);
  if (!projectId) return unauthorized();

  const json = await request.json().catch(() => null);
  const parsed = asmrPresetPayloadSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid preset", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const preset = createAsmrPreset(projectId, parsed.data);
  return NextResponse.json({ preset }, { status: 201 });
}
