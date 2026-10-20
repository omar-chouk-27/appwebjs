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
    const sessions = await prisma.session.findMany({
      include: { model: true },
      orderBy: { time: "desc" },
      take: 20,
    });

    return (
      <main className="mx-auto min-h-screen w-full max-w-6xl px-6 py-10">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-900">
                Bonjour, {admin.name} {admin.surname}
              </h1>
              <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-bold text-purple-800">
                ADMINISTRATEUR
              </span>
            </div>
            <p className="mt-1 text-sm text-slate-500">
              {admin.email} • Espace d'administration Token Optimizer
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
            id: admin.id,
            name: admin.name,
            surname: admin.surname,
            email: admin.email,
            role: "admin",
            isAdmin: true,
            totalPrompts: 0,
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
    take: 20,
  });

  return (
    <main className="mx-auto min-h-screen w-full max-w-6xl px-6 py-10">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900">
              Bonjour, {user.name} {user.surname}
            </h1>
            <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-800">
              UTILISATEUR
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            {user.email} • {user.totalPrompts} prompts soumis
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
        }}
      />
    </main>
  );
}
