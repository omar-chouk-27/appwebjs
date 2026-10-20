import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { NextResponse } from "next/server";
import z from "zod"


export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

  if (!id)
    return NextResponse.json({ error: "id is required" }, { status: 400 });

  const model = await prisma.model.findFirst({ where: { id } });

  if (!model)
    return NextResponse.json({ error: "Model not found" }, { status: 404 });

  return NextResponse.json({ id: model.id, name: model.name, provider: model.provider }, { status: 200 });
}



export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();  // ← await
    if (!admin)
      return NextResponse.json({ error: "Admin login required" }, { status: 401 }); // ← 401 not 404
    const { id } = await params;

  if (!id)
    return NextResponse.json({ error: "id is required" }, { status: 400 });

  try {
    await prisma.model.delete({ where: { id } });
    return NextResponse.json({ message: "Model deleted" }, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Model not found" }, { status: 404 });
  }
}