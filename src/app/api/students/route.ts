import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { createStudentSchema } from "@/lib/validation";

// Exclusion stricte de password dans toutes les requêtes (conformité TP2)
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
 * GET /api/students
 * Matrice des permissions TP2 :
 * - ADMIN : Accès à toute la liste des étudiants (et utilisateurs)
 * - ENSEIGNANT : Accès à la liste des étudiants (role = "ETUDIANT")
 * - ETUDIANT : Accès uniquement à ses propres données (protection anti-IDOR)
 * - Non connecté : 401 Unauthorized
 */
export async function GET() {
  const auth = await requireRole(["ADMIN", "ENSEIGNANT", "ETUDIANT"]);
  if (auth.errorResponse) return auth.errorResponse;

  const { user } = auth;

  // Si ETUDIANT : ne renvoie QUE son propre profil
  if (user.role === "ETUDIANT") {
    const me = await prisma.user.findUnique({
      where: { id: user.id },
      select: studentSelect,
    });
    return NextResponse.json(me ? [me] : []);
  }

  // Si ENSEIGNANT ou ADMIN : consulte la liste
  const students = await prisma.user.findMany({
    where: user.role === "ENSEIGNANT" ? { role: "ETUDIANT" } : undefined,
    select: studentSelect,
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(students);
}

/**
 * POST /api/students
 * Matrice des permissions TP2 :
 * - ADMIN uniquement : Création d'un étudiant (201 Created)
 * - ENSEIGNANT ou ETUDIANT : Refusé (403 Forbidden)
 * - Non connecté : 401 Unauthorized
 */
export async function POST(req: Request) {
  const auth = await requireRole(["ADMIN"]);
  if (auth.errorResponse) return auth.errorResponse;

  const body = await req.json().catch(() => null);
  const parsed = createStudentSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }

  const { name, email, password, role, filiere, notes } = parsed.data;

  // Vérifier doublon email
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json(
      { error: "Cet email est déjà utilisé" },
      { status: 409 }
    );
  }

  const hash = await bcrypt.hash(password, 10);

  const student = await prisma.user.create({
    data: {
      name,
      email,
      password: hash,
      role: role ?? "ETUDIANT",
      filiere: filiere ?? null,
      notes: notes ?? null,
    },
    select: studentSelect,
  });

  return NextResponse.json(student, { status: 201 });
}
