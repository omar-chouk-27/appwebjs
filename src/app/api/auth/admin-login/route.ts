import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { createSession } from "@/lib/session";
import { z } from "zod";

const schema = z.object({
  email:    z.string().email(),
  password: z.string().min(1),
});

export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });

  const { email, password } = parsed.data;

  // look in the Admin table, not User
  const admin = await prisma.admin.findUnique({ where: { email } });

  if (!admin || !(await bcrypt.compare(password, admin.password)))
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });

  // put isAdmin: true in the JWT
  const token = await createSession(admin.id, true);

  return NextResponse.json({ token });
}