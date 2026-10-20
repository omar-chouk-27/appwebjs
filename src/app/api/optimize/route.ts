import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { optimizePrompt } from "@/lib/tokenOptimizer";
import { z } from "zod";

const optimizeSchema = z.object({
  raw_prompt: z.string().min(1, "Le prompt ne peut pas être vide"),
  modelId: z.string().min(1, "Modèle requis"),
  language: z.string().default("English"),
  replaceUuids: z.boolean().default(true),
  shortenUrls: z.boolean().default(true),
  reduceTimestamps: z.boolean().default(true),
  normalizeWhitespace: z.boolean().default(true),
  cleanUnicode: z.boolean().default(true),
  stripBase64: z.boolean().default(true),
  removeRedundancy: z.boolean().default(true),
});

/**
 * POST /api/optimize
 * Endpoint principal du cas d'utilisation "use fast optimisation method"
 * Enregistre une Session d'optimisation reliée à l'User et au Model
 */
export async function POST(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Connexion requise" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = optimizeSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }

  const {
    raw_prompt,
    modelId,
    language,
    replaceUuids,
    shortenUrls,
    reduceTimestamps,
    normalizeWhitespace,
    cleanUnicode,
    stripBase64,
    removeRedundancy,
  } = parsed.data;

  // Vérifier le modèle
  const model = await prisma.model.findUnique({ where: { id: modelId } });
  if (!model) {
    return NextResponse.json({ error: "Modèle introuvable" }, { status: 404 });
  }

  // Effectuer l'optimisation
  const result = optimizePrompt(raw_prompt, {
    replaceUuids,
    shortenUrls,
    reduceTimestamps,
    normalizeWhitespace,
    cleanUnicode,
    stripBase64,
    removeRedundancy,
  });

  // Sauvegarder la session en base
  const createdSession = await prisma.session.create({
    data: {
      raw_prompt: result.raw_prompt,
      opt_prompt: result.opt_prompt,
      language,
      tokensSaved: result.tokensSaved,
      modelId: model.id,
      userId: session.userId,
    },
    include: {
      model: true,
    },
  });

  // Incrémenter totalPrompts de l'utilisateur
  await prisma.user.update({
    where: { id: session.userId },
    data: {
      totalPrompts: { increment: 1 },
    },
  }).catch(() => null);

  return NextResponse.json({
    session: createdSession,
    metrics: result,
  });
}
