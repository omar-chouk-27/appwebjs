import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import z from "zod"

const schema = z.object({
  name: z.string().trim().min(2).optional(),
  surname: z.string().trim().min(2).optional(),
  email: z.string().trim().toLowerCase().email().optional(),
  password: z.string().min(8).optional(),
  role: z.string().optional(),
  totalPrompts: z.int().nonnegative().optional(),
});

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
    if (!admin){
      return NextResponse.json({ error: "admin login required " }, { status: 404 });
    }
    const { id } = await params;
if (!id)
    return NextResponse.json({ error: "id is required" }, { status: 400 });

  const users =    await prisma.user.findUnique({where :{id:id},
     select: { id: true, name: true, surname: true, email: true, role: true, totalPrompts: true },
   });

  if (!users)
    return NextResponse.json({ error: "user not found" }, { status: 404 });

  return NextResponse.json({ users }, { status: 200 });
}



export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin){
    return NextResponse.json({ error: "admin login required " }, { status: 404 });
  }
    const { id } = await params;

  if (!id)
    return NextResponse.json({ error: "id is required" }, { status: 400 });

  try {
    await prisma.user.delete({ where: { id } });
    return NextResponse.json({ message: "user deleted" }, { status: 200 });
  } catch {
    return NextResponse.json({ error: "user not found" }, { status: 404 });
  }
}


export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin){
    return NextResponse.json({ error: "admin login required " }, { status: 404 });
  }
    const { id } = await params;

  if (!id)
    return NextResponse.json({ error: "id is required" }, { status: 400 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });

  try {
    const data = { ...parsed.data };
  if (data.password) data.password = await bcrypt.hash(data.password, 10);
  const user = await prisma.user.update({ where: { id }, data });
    return NextResponse.json({ id: user.id, name: user.name, email: user.email }, { status: 200 });
  } catch {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }
}