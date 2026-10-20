import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { requireAdmin } from "@/lib/session";


const schema = z.object({
  name:     z.string().trim().min(2),
  surname:  z.string().trim().min(2),
  email:    z.string().trim().toLowerCase().email(),
  password: z.string().min(8),

});

export async function GET(req: Request) {
  const admin = await requireAdmin();  // ← await
  if (!admin)
    return NextResponse.json({ error: "Admin login required" }, { status: 401 }); // ← 401 not 404

  const session = await prisma.session.findMany();

  if (!session)
    return NextResponse.json({ error: "session not found" }, { status: 404 });

  return NextResponse.json(session);
}