import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import {
  adminUpdateStudentSchema,
  teacherUpdateStudentSchema,
} from "@/lib/validation";

const studentSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  filiere: true,
  notes: true,
  createdAt: true,
} as const;

/**
 * GET /api/students/[id]
 * Règle de sécurité :
 * - ADMIN / ENSEIGNANT : accès autorisé
 * - ETUDIANT : uniquement son propre ID (prévention IDOR)
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const targetId = parseInt(id, 10);

  if (isNaN(targetId)) {
    return NextResponse.json({ error: "Identifiant invalide" }, { status: 400 });
  }

  const auth = await requireRole(["ADMIN", "ENSEIGNANT", "ETUDIANT"]);
  if (auth.errorResponse) return auth.errorResponse;

  const { user } = auth;

  // Protection IDOR : un étudiant ne peut pas consulter le profil d'un autre étudiant
  if (user.role === "ETUDIANT" && user.id !== targetId) {
    return NextResponse.json(
      { error: "Accès refusé : vous ne pouvez consulter que votre propre profil" },
      { status: 403 }
    );
  }

  const student = await prisma.user.findUnique({
    where: { id: targetId },
    select: studentSelect,
  });

  if (!student) {
    return NextResponse.json(
      { error: "Étudiant introuvable" },
      { status: 404 }
    );
  }

  return NextResponse.json(student);
}

/**
 * PATCH /api/students/[id]
 * Matrice des permissions TP2 :
 * - ADMIN : modification complète autorisée
 * - ENSEIGNANT : modification des informations pédagogiques (filière, notes) uniquement
 * - ETUDIANT : modification refusée (403 Forbidden)
 */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const targetId = parseInt(id, 10);

  if (isNaN(targetId)) {
    return NextResponse.json({ error: "Identifiant invalide" }, { status: 400 });
  }

  const auth = await requireRole(["ADMIN", "ENSEIGNANT"]);
  if (auth.errorResponse) return auth.errorResponse;

  const { user } = auth;

  // Vérifier si la cible existe
  const targetUser = await prisma.user.findUnique({
    where: { id: targetId },
  });

  if (!targetUser) {
    return NextResponse.json(
      { error: "Étudiant introuvable" },
      { status: 404 }
    );
  }

  const body = await req.json().catch(() => null);

  // Application des règles selon le rôle
  if (user.role === "ENSEIGNANT") {
    // Un enseignant ne modifie que les champs pédagogiques d'un étudiant
    const parsed = teacherUpdateStudentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const updated = await prisma.user.update({
      where: { id: targetId },
      data: {
        filiere: parsed.data.filiere !== undefined ? parsed.data.filiere : targetUser.filiere,
        notes: parsed.data.notes !== undefined ? parsed.data.notes : targetUser.notes,
      },
      select: studentSelect,
    });

    return NextResponse.json(updated);
  }

  // Rôle ADMIN : validation large
  const parsed = adminUpdateStudentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }

  // Si l'email est modifié, vérifier qu'il n'est pas déjà pris
  if (parsed.data.email && parsed.data.email !== targetUser.email) {
    const emailExists = await prisma.user.findUnique({
      where: { email: parsed.data.email },
    });
    if (emailExists) {
      return NextResponse.json(
        { error: "Cet email est déjà utilisé" },
        { status: 409 }
      );
    }
  }

  const updated = await prisma.user.update({
    where: { id: targetId },
    data: parsed.data,
    select: studentSelect,
  });

  return NextResponse.json(updated);
}

/**
 * DELETE /api/students/[id]
 * Matrice des permissions TP2 :
 * - ADMIN uniquement : suppression autorisée
 * - ENSEIGNANT ou ETUDIANT : 403 Forbidden
 */
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const targetId = parseInt(id, 10);

  if (isNaN(targetId)) {
    return NextResponse.json({ error: "Identifiant invalide" }, { status: 400 });
  }

  const auth = await requireRole(["ADMIN"]);
  if (auth.errorResponse) return auth.errorResponse;

  const targetUser = await prisma.user.findUnique({
    where: { id: targetId },
  });

  if (!targetUser) {
    return NextResponse.json(
      { error: "Étudiant introuvable" },
      { status: 404 }
    );
  }

  // Empêcher l'administrateur de s'auto-supprimer par mégarde
  if (targetId === auth.user.id) {
    return NextResponse.json(
      { error: "Impossible de supprimer votre propre compte administrateur" },
      { status: 400 }
    );
  }

  await prisma.user.delete({
    where: { id: targetId },
  });

  return NextResponse.json({ ok: true, message: "Étudiant supprimé avec succès" });
}
