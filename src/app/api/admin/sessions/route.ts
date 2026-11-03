import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";

export async function GET(req: Request) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Connexion administrateur requise" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");

  const sessions = await prisma.session.findMany({
    where: userId ? { userId } : undefined,
    include: {
      model: true,
      user: {
        select: {
          id: true,
          name: true,
          surname: true,
          email: true,
          role: true,
          tokenQuota: true,
          tokensUsed: true,
        },
      },
      admin: {
        select: {
          id: true,
          name: true,
          surname: true,
          email: true,
        },
      },
    },
    orderBy: { time: "desc" },
  });

  return NextResponse.json(sessions);
}
