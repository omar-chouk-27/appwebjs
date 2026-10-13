import Link from "next/link";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col items-center justify-center gap-6 px-6 text-center">
      <div className="space-y-2">
        <p className="text-sm font-medium uppercase tracking-[0.3em] text-slate-500">
          TP Authentification
        </p>
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          Next.js, Prisma et SQLite
        </h1>
        <p className="text-slate-600">
          Connectez-vous ou créez un compte pour accéder au tableau de bord.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/login"
          className="rounded bg-slate-900 px-4 py-2 font-medium text-white"
        >
          Se connecter
        </Link>
        <Link
          href="/register"
          className="rounded border border-slate-300 bg-white px-4 py-2 font-medium text-slate-900"
        >
          S'inscrire
        </Link>
      </div>
    </main>
  );
}
