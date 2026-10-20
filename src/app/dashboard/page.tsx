import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import LogoutButton from "@/components/LogoutButton";
import StudentManager from "@/components/StudentManager";

export default async function DashboardPage() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

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
    redirect("/login");
  }

  const userRole = (user.role as "ADMIN" | "ENSEIGNANT" | "ETUDIANT") || "ETUDIANT";

  return (
    <main className="mx-auto min-h-screen w-full max-w-5xl px-6 py-12">
      {/* En-tête profil utilisateur */}
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900">
              Bonjour, {user.name}
            </h1>
            <span
              className={`rounded-full px-3 py-1 text-xs font-bold ${
                userRole === "ADMIN"
                  ? "bg-purple-100 text-purple-800"
                  : userRole === "ENSEIGNANT"
                  ? "bg-blue-100 text-blue-800"
                  : "bg-emerald-100 text-emerald-800"
              }`}
            >
              {userRole}
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            {user.email} • Membre depuis le{" "}
            {user.createdAt.toLocaleDateString("fr-FR")}
          </p>
          {user.filiere && (
            <p className="mt-1 text-xs font-medium text-slate-600">
              Filière : <span className="text-slate-900">{user.filiere}</span>
            </p>
          )}
        </div>

        <LogoutButton />
      </div>

      {/* Module de gestion des étudiants adapté aux rôles (TP2) */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <StudentManager
          currentUserRole={userRole}
          currentUserId={user.id}
        />
      </div>
    </main>
  );
}
