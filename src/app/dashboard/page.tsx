import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import LogoutButton from "@/components/LogoutButton";
import TokenOptimizerDashboard from "@/components/TokenOptimizerDashboard";

export default async function DashboardPage() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  // Si c'est un administrateur
  if (session.isAdmin) {
    const admin = await prisma.admin.findUnique({
      where: { id: session.userId },
    });

    if (!admin) redirect("/login");

    const models = await prisma.model.findMany();

    // Récupérer toutes les sessions d'optimisation pour l'administration
    const sessions = await prisma.session.findMany({
      include: {
        model: true,
        user: {
          select: {
            id: true,
            name: true,
            surname: true,
            email: true,
            role: true,
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

    // Récupérer tous les utilisateurs enregistrés
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        surname: true,
        email: true,
        role: true,
        totalPrompts: true,
        tokenQuota: true,
        tokensUsed: true,
        createdAt: true,
        _count: {
          select: { sessions: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return (
      <main className="mx-auto min-h-screen w-full max-w-7xl px-4 sm:px-6 py-8">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl backdrop-blur-sm">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-white">
                Bonjour, {admin.name} {admin.surname}
              </h1>
              <span className="rounded-full bg-purple-500/15 border border-purple-500/30 px-3 py-1 text-xs font-bold text-purple-300">
                ADMINISTRATEUR
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-400">
              {admin.email} • Espace de supervision & gestion Token Optimizer
            </p>
          </div>
          <LogoutButton />
        </div>

        <TokenOptimizerDashboard
          models={models}
          initialSessions={sessions.map((s) => ({
            ...s,
            time: s.time.toISOString(),
          }))}
          initialUsers={users.map((u) => ({
            ...u,
            createdAt: u.createdAt.toISOString(),
          }))}
          currentUser={{
            id: admin.id,
            name: admin.name,
            surname: admin.surname,
            email: admin.email,
            role: "admin",
            isAdmin: true,
            totalPrompts: 0,
            tokenQuota: 9999999,
            tokensUsed: 0,
          }}
        />
      </main>
    );
  }

  // Utilisateur standard
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
  });

  if (!user) {
    redirect("/login");
  }

  const models = await prisma.model.findMany();
  const sessions = await prisma.session.findMany({
    where: { userId: user.id },
    include: { model: true },
    orderBy: { time: "desc" },
    take: 50,
  });

  return (
    <main className="mx-auto min-h-screen w-full max-w-6xl px-4 sm:px-6 py-8">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl backdrop-blur-sm">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-white">
              Bonjour, {user.name} {user.surname}
            </h1>
            <span className="rounded-full bg-blue-500/15 border border-blue-500/30 px-3 py-1 text-xs font-bold text-blue-300">
              UTILISATEUR
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-400">
            {user.email} • {user.totalPrompts} prompts optimisés • Quota: {user.tokensUsed.toLocaleString()} /{" "}
            {user.tokenQuota.toLocaleString()} tokens
          </p>
        </div>
        <LogoutButton />
      </div>

      <TokenOptimizerDashboard
        models={models}
        initialSessions={sessions.map((s) => ({
          ...s,
          time: s.time.toISOString(),
        }))}
        currentUser={{
          id: user.id,
          name: user.name,
          surname: user.surname,
          email: user.email,
          role: user.role,
          isAdmin: false,
          totalPrompts: user.totalPrompts,
          tokenQuota: user.tokenQuota,
          tokensUsed: user.tokensUsed,
        }}
      />
    </main>
  );
}
