import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { NextResponse } from "next/server";
import z from "zod"


export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();  // ← await
  if (!admin)
    return NextResponse.json({ error: "Admin login required" }, { status: 401 }); // ← 401 not 404

      const { id } = await params;
if (!id)
    return NextResponse.json({ error: "id is required" }, { status: 400 });

  const sessions = await prisma.session.findFirst({ where: { id } });

  if (!sessions)
    return NextResponse.json({ error: "session not found" }, { status: 404 });

  return NextResponse.json({ sessions }, { status: 200 });
}



export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();  // ← await
  if (!admin)
    return NextResponse.json({ error: "Admin login required" }, { status: 401 }); // ← 401 not 404

   const { id } = await params;

  if (!id)
    return NextResponse.json({ error: "id is required" }, { status: 400 });

  try {
    await prisma.session.delete({ where: { id } });
    return NextResponse.json({ message: "session deleted" }, { status: 200 });
  } catch {
    return NextResponse.json({ error: "session not found" }, { status: 404 });
  }
}