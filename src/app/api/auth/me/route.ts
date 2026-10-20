import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export async function GET() {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  if (session.isAdmin) {
    const admin = await prisma.admin.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        name: true,
        surname: true,
        email: true,
        createdAt: true,
      },
    });

    if (!admin) {
      return NextResponse.json({ error: "Introuvable" }, { status: 404 });
    }

    return NextResponse.json({ ...admin, role: "admin", isAdmin: true });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      name: true,
      surname: true,
      email: true,
      role: true,
      totalPrompts: true,
      createdAt: true,
    },
  });

  if (!user) {
    return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  }

  return NextResponse.json({ ...user, isAdmin: false });
}
