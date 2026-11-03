import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";

const updateUserSchema = z.object({
  name: z.string().trim().min(2).optional(),
  surname: z.string().trim().min(2).optional(),
  email: z.string().trim().toLowerCase().email().optional(),
  password: z.string().min(6).optional(),
  role: z.string().optional(),
  totalPrompts: z.number().int().nonnegative().optional(),
  tokenQuota: z.number().int().nonnegative().optional(),
  tokensUsed: z.number().int().nonnegative().optional(),
});

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Connexion administrateur requise" }, { status: 401 });
  }

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "L'identifiant est requis" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      surname: true,
      email: true,
      role: true,
      totalPrompts: true,
      tokenQuota: true,
      tokensUsed: true,
      createdAt: true,
      sessions: {
        include: { model: true },
        orderBy: { time: "desc" },
      },
    },
  });

  if (!user) {
    return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
  }

  return NextResponse.json(user, { status: 200 });
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
    await prisma.user.delete({ where: { id } });
    return NextResponse.json({ message: "Utilisateur supprimé" }, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Connexion administrateur requise" }, { status: 401 });
  }

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "L'identifiant est requis" }, { status: 400 });
  }

  const body = await req.json().catch(() => null);
  const parsed = updateUserSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  try {
    const data = { ...parsed.data };
    if (data.password) {
      data.password = await bcrypt.hash(data.password, 10);
    }
    const user = await prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        name: true,
        surname: true,
        email: true,
        role: true,
        totalPrompts: true,
        tokenQuota: true,
        tokensUsed: true,
      },
    });

    return NextResponse.json(user, { status: 200 });
  } catch (err: unknown) {
    return NextResponse.json({ error: "Impossible de modifier l'utilisateur" }, { status: 400 });
  }
}
