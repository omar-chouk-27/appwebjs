import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { NextResponse } from "next/server";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Connexion administrateur requise" }, { status: 401 });
  }

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "L'identifiant est requis" }, { status: 400 });
  }

  const session = await prisma.session.findUnique({
    where: { id },
    include: {
      model: true,
      user: {
        select: {
          id: true,
          name: true,
          surname: true,
          email: true,
          role: true,
          tokenQuota: true,
          tokensUsed: true,
        },
      },
      admin: {
        select: {
          id: true,
          name: true,
          surname: true,
          email: true,
        },
      },
    },
  });

  if (!session) {
    return NextResponse.json({ error: "Session introuvable" }, { status: 404 });
  }

  return NextResponse.json(session, { status: 200 });
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Connexion administrateur requise" }, { status: 401 });
  }

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "L'identifiant est requis" }, { status: 400 });
  }

  try {
    await prisma.session.delete({ where: { id } });
    return NextResponse.json({ message: "Session supprimée avec succès" }, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Session introuvable" }, { status: 404 });
  }
}
