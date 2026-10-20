import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import z from "zod";

const schema = z.object({
  name: z.string().trim().min(2).optional(),
  surname: z.string().trim().min(2).optional(),
  email: z.string().trim().toLowerCase().email().optional(),
  password: z.string().min(8).optional(),
});

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;

  if (!id)
    return NextResponse.json({ error: "id is required" }, { status: 400 });

  // user can only delete their own account
  if (session.userId !== id)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    await prisma.user.delete({ where: { id } });
    return NextResponse.json({ message: "User deleted" }, { status: 200 });
  } catch {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

   const { id } = await params;

  if (!id)
    return NextResponse.json({ error: "id is required" }, { status: 400 });

  // user can only update their own profile
  if (session.userId !== id)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 },
    );

  try {
    const user = await prisma.user.update({
      where: { id },
      data: parsed.data,
    });
    return NextResponse.json(
      { id: user.id, name: user.name, email: user.email },
      { status: 200 },
    );
  } catch {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }
}


