import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export type Role = "ADMIN" | "ENSEIGNANT" | "ETUDIANT";

export interface AuthenticatedUser {
  id: number;
  name: string;
  email: string;
  role: Role;
  filiere?: string | null;
  notes?: string | null;
  createdAt: Date;
}

type AuthResult =
  | { user: AuthenticatedUser; errorResponse?: never }
  | { user?: never; errorResponse: NextResponse };

/**
 * requireRole vérifie :
 * 1. La présence et la validité de la session JWT côté serveur (sinon 401 Unauthorized)
 * 2. L'existence réelle de l'utilisateur en base de données (sinon 401 Unauthorized)
 * 3. L'adéquation du rôle réel de l'utilisateur avec les rôles autorisés (sinon 403 Forbidden)
 *
 * Règle TP2 : Ne JAMAIS se fier au rôle envoyé par le client.
 */
export async function requireRole(allowedRoles: Role[]): Promise<AuthResult> {
  const session = await getSession();

  if (!session || !session.userId) {
    return {
      errorResponse: NextResponse.json(
        { error: "Non authentifié" },
        { status: 401 }
      ),
    };
  }

  // Vérification de sécurité en profondeur : relecture en base de données
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      filiere: true,
      notes: true,
      createdAt: true,
    },
  });

  if (!user) {
    return {
      errorResponse: NextResponse.json(
        { error: "Utilisateur introuvable" },
        { status: 401 }
      ),
    };
  }

  const userRole = (user.role as Role) || "ETUDIANT";

  if (!allowedRoles.includes(userRole)) {
    return {
      errorResponse: NextResponse.json(
        { error: "Accès refusé : rôle insuffisant" },
        { status: 403 }
      ),
    };
  }

  return {
    user: {
      ...user,
      role: userRole,
    },
  };
}
