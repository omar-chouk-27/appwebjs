import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/session";
import { z } from "zod";

const registerSchema = z.object({
  name: z.string().trim().min(2, "Nom : 2 caractères minimum"),
  surname: z.string().trim().min(2, "Prénom : 2 caractères minimum").optional(),
  email: z.string().trim().toLowerCase().email("Email invalide"),
  password: z.string().min(8, "Mot de passe : 8 caractères minimum"),
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = registerSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }

  const { name, surname, email, password } = parsed.data;

  // Vérifier doublon dans User ou Admin
  const existingUser = await prisma.user.findUnique({ where: { email } });
  const existingAdmin = await prisma.admin.findUnique({ where: { email } });

  if (existingUser || existingAdmin) {
    return NextResponse.json(
      { error: "Cet email est déjà utilisé" },
      { status: 409 }
    );
  }

  const hash = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      name,
      surname: surname || name,
      email,
      password: hash,
      role: "user",
      totalPrompts: 0,
    },
  });

  await createSession(user.id, false);

  return NextResponse.json(
    { id: user.id, name: user.name, surname: user.surname, email: user.email },
    { status: 201 }
  );
}
