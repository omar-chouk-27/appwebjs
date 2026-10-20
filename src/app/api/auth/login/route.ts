import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/session";
import { loginSchema } from "@/lib/validation";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 },
    );
  }

  const { email, password } = parsed.data;
  const user = await prisma.user.findUnique({ where: { email } });
  const ok = user ? await bcrypt.compare(password, user.password) : false;

  if (!user || !ok) {
    return NextResponse.json(
      { error: "Identifiants invalides" },
      { status: 401 },
    );
  }

  const role = (user.role as "ADMIN" | "ENSEIGNANT" | "ETUDIANT") || "ETUDIANT";
  await createSession(user.id, role);

  return NextResponse.json({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  });
}
