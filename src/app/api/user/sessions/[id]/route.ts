import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import z from "zod";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
  if (!id)
    return NextResponse.json({ error: "id is required" }, { status: 400 });

  const auth = await getSession();
  if (!auth)
    return NextResponse.json({ error: "log in required" }, { status: 401 });
  if (id == auth.userId)
  {const sessions = await prisma.session.findMany({
    where: { userId: auth.userId }, // only return this user's sessions
  });
return NextResponse.json(sessions, { status: 200 });

}else{
    return NextResponse.json({"erro":"Unauthorized"}, { status: 401 });
}

  
}
