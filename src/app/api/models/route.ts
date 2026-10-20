import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { NextResponse } from "next/server";
import z from "zod"

const schema = z.object({
    name: z.string().trim(),
    provider: z.string().trim(),
})
export async function POST(req:Request) {
    const admin = await requireAdmin();  // ← await
      if (!admin)
        return NextResponse.json({ error: "Admin login required" }, { status: 401 }); // ← 401 not 404
    const parsed = schema.safeParse(await req.json().catch(()=> null))
    if (!parsed.success){
        return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });}
    const {name,provider}=parsed.data;
    if (await prisma.model.findFirst({ where: { name } }))
        return NextResponse.json({ error: "Model name already exists" }, { status: 409 });
    const model = await prisma.model.create({
        data:{
            name,
            provider
        }
    })
      return NextResponse.json({ id: model.id, name: model.name, provider: model.provider }, { status: 201 });

}

export async function GET(req: Request) {
  
  const model = await prisma.model.findMany();

  if (!model)
    return NextResponse.json({ error: "Model not found" }, { status: 404 });

  return NextResponse.json(model);
}



