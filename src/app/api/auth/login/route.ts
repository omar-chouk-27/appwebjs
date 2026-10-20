import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/session";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Email invalide"),
  password: z.string().min(1, "Mot de passe requis"),
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }

  const { email, password } = parsed.data;

  // 1. Chercher dans User
  const user = await prisma.user.findUnique({ where: { email } });
  if (user) {
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) {
      return NextResponse.json({ error: "Identifiants invalides" }, { status: 401 });
    }

    await createSession(user.id, false);
    return NextResponse.json({
      id: user.id,
      name: user.name,
      surname: user.surname,
      email: user.email,
      role: user.role,
      isAdmin: false,
    });
  }

  // 2. Chercher dans Admin
  const admin = await prisma.admin.findUnique({ where: { email } });
  if (admin) {
    const ok = await bcrypt.compare(password, admin.password);
    if (!ok) {
      return NextResponse.json({ error: "Identifiants invalides" }, { status: 401 });
    }

    await createSession(admin.id, true);
    return NextResponse.json({
      id: admin.id,
      name: admin.name,
      surname: admin.surname,
      email: admin.email,
      role: "admin",
      isAdmin: true,
    });
  }

  return NextResponse.json({ error: "Identifiants invalides" }, { status: 401 });
}
