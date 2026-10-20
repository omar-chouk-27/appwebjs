import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { createSession } from "@/lib/session";
import { z } from "zod";

const schema = z.object({
  name:     z.string().trim().min(2),
  surname:  z.string().trim().min(2),
  email:    z.string().trim().toLowerCase().email(),
  password: z.string().min(8),
});

export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });

  const { name, surname, email, password } = parsed.data;

  // check if email already taken
  const existing = await prisma.admin.findUnique({ where: { email } });
  if (existing)
    return NextResponse.json({ error: "Email already in use" }, { status: 409 });

  const admin = await prisma.admin.create({   // ← await
    data: {
      name,
      surname,
      email,
      password: await bcrypt.hash(password, 10),
      // createdAt: removed — @default(now()) in schema handles it
    },
  });

  const token = await createSession(admin.id, true); // isAdmin = true

  return NextResponse.json({ token }, { status: 201 }); // ← response
}