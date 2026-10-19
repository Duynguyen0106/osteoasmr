import { NextResponse } from "next/server";
import { asmrPresetPayloadSchema } from "@/lib/contract/asmr-preset";
import {
  deleteAsmrPreset,
  updateAsmrPreset,
} from "@/lib/server/asmr-preset-service";
import { resolveProjectFromRequest, unauthorized } from "@/lib/server/access";

type Params = { params: Promise<{ id: string }> };

export async function PUT(request: Request, { params }: Params) {
  const projectId = resolveProjectFromRequest(request);
  if (!projectId) return unauthorized();

  const { id } = await params;
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

export async function DELETE(request: Request, { params }: Params) {
  const projectId = resolveProjectFromRequest(request);
  if (!projectId) return unauthorized();

  const { id } = await params;
  const ok = deleteAsmrPreset(projectId, id);
  if (!ok) {
    return NextResponse.json({ error: "Preset not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
