import { NextResponse } from "next/server";
import { asmrPresetPayloadSchema } from "@/lib/contract/asmr-preset";
import {
  createAsmrPreset,
  deleteAsmrPreset,
  listAsmrPresets,
  updateAsmrPreset,
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

function presetIdFromRequest(request: Request): string | null {
  const id = new URL(request.url).searchParams.get("id")?.trim();
  return id || null;
}

export async function PUT(request: Request) {
  const projectId = resolveProjectFromRequest(request);
  if (!projectId) return unauthorized();

  const id = presetIdFromRequest(request);
  if (!id) {
    return NextResponse.json({ error: "Missing id query parameter" }, { status: 400 });
  }

  const json = await request.json().catch(() => null);
  const parsed = asmrPresetPayloadSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid preset", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const preset = updateAsmrPreset(projectId, id, parsed.data);
  if (!preset) {
    return NextResponse.json({ error: "Preset not found" }, { status: 404 });
  }
  return NextResponse.json({ preset });
}

export async function DELETE(request: Request) {
  const projectId = resolveProjectFromRequest(request);
  if (!projectId) return unauthorized();

  const id = presetIdFromRequest(request);
  if (!id) {
    return NextResponse.json({ error: "Missing id query parameter" }, { status: 400 });
  }

  const ok = deleteAsmrPreset(projectId, id);
  if (!ok) {
    return NextResponse.json({ error: "Preset not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
