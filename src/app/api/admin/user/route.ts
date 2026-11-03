import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { requireAdmin } from "@/lib/session";

const createUserSchema = z.object({
  name: z.string().trim().min(2, "Le prénom doit contenir au moins 2 caractères"),
  surname: z.string().trim().min(2, "Le nom doit contenir au moins 2 caractères"),
  email: z.string().trim().toLowerCase().email("Email invalide"),
  password: z.string().min(6, "Le mot de passe doit contenir au moins 6 caractères"),
  role: z.string().default("user"),
  tokenQuota: z.number().int().nonnegative().default(10000),
});

export async function GET(req: Request) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Connexion administrateur requise" }, { status: 401 });
  }

  const users = await prisma.user.findMany({
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
      _count: {
        select: { sessions: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(users);
}

export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Connexion administrateur requise" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = createUserSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const { name, surname, email, password, role, tokenQuota } = parsed.data;

  // Vérifier si l'email existe déjà
  const existingUser = await prisma.user.findUnique({ where: { email } });
  const existingAdmin = await prisma.admin.findUnique({ where: { email } });
  if (existingUser || existingAdmin) {
    return NextResponse.json({ error: "Cet email est déjà utilisé" }, { status: 409 });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const newUser = await prisma.user.create({
    data: {
      name,
      surname,
      email,
      password: hashedPassword,
      role,
      tokenQuota,
      tokensUsed: 0,
      adminId: admin.id,
    },
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
    },
  });

  return NextResponse.json(newUser, { status: 201 });
}
