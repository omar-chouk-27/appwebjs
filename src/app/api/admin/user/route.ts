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
  const admin = await requireAdmin();
    if (!admin){
      return NextResponse.json({ error: "admin login required " }, { status: 404 });
    }
  
  const user =    await prisma.user.findMany({
     select: { id: true, name: true, surname: true, email: true, role: true, totalPrompts: true },
   });

  if (!user)
    return NextResponse.json({ error: "user not found" }, { status: 404 });

  return NextResponse.json(user);
}