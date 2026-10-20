import Link from "next/link";

export default function HomePage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-100">
      {/* Background glow effects */}
      <div className="pointer-events-none absolute -top-40 left-1/2 -z-10 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-indigo-600/20 blur-[130px]" />
      <div className="pointer-events-none absolute top-1/2 -right-40 -z-10 h-[400px] w-[500px] rounded-full bg-cyan-500/10 blur-[120px]" />

      {/* Navigation Header */}
      <header className="border-b border-slate-800/80 bg-slate-950/60 backdrop-blur-md sticky top-0 z-50">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-500 to-cyan-400 font-mono text-xl font-black text-white shadow-lg shadow-indigo-500/30">
              ⚡
            </div>
            <div>
              <span className="font-mono text-lg font-bold tracking-tight text-white">
                Token<span className="text-indigo-400">Opt</span>
              </span>
              <span className="ml-2 rounded-full bg-indigo-500/10 px-2 py-0.5 text-[10px] font-semibold text-indigo-400 border border-indigo-500/20">
                v2.0
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="rounded-lg px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition"
            >
              Connexion
            </Link>
            <Link
              href="/register"
              className="rounded-lg bg-gradient-to-r from-indigo-600 to-cyan-500 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-indigo-600/30 hover:opacity-90 transition"
            >
              Commencer Gratuitement
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="mx-auto max-w-5xl px-6 pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-950/40 px-3 py-1 text-xs font-semibold text-indigo-300 mb-6">
          <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          Moteur d'Optimisation de Prompts & de Coûts LLM
        </div>

        <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl text-white">
          Réduisez jusqu'à <span className="bg-gradient-to-r from-indigo-400 via-cyan-400 to-emerald-400 bg-clip-text text-transparent">60% de vos Tokens</span> sans altérer la qualité
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-base sm:text-lg text-slate-400 leading-relaxed">
          Spécifiquement conçu pour les équipes utilisant OpenAI, Anthropic et Google Gemini. Supprimez les UUIDs superflus, nettoyez les caractères Unicode invisibles, tronquez les URLs signées et accélérez le temps de réponse de vos agents IA.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/dashboard"
            className="rounded-xl bg-indigo-600 px-6 py-3.5 text-sm font-bold text-white shadow-xl shadow-indigo-600/40 hover:bg-indigo-500 transition"
          >
            Accéder au Dashboard →
          </Link>
          <Link
            href="/login"
            className="rounded-xl border border-slate-700 bg-slate-900/60 px-6 py-3.5 text-sm font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition"
          >
            Se Connecter avec les comptes de test
          </Link>
        </div>

        {/* Aperçu interactif Avant / Après */}
        <div className="mt-14 overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/80 p-6 text-left shadow-2xl backdrop-blur-sm">
          <div className="mb-4 flex items-center justify-between border-b border-slate-800 pb-3">
            <span className="font-mono text-xs font-semibold text-slate-400">
              DÉMONSTRATION DU MOTEUR EN TEMPS RÉEL
            </span>
            <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-xs font-bold text-emerald-400 border border-emerald-500/30">
              -54% Tokens économisés
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs">
            <div className="rounded-xl border border-red-500/20 bg-red-950/10 p-4">
              <span className="font-bold text-red-400 block mb-2">❌ Prompt Brut (70 Tokens) :</span>
              <p className="text-slate-400 whitespace-pre-wrap leading-relaxed">
                Can you please help me to write a very detailed and comprehensive summary for order 550e8400-e29b-41d4-a716-446655440000 created at 2024-03-15T14:32:45.123Z with file https://x4f9k.s3.amazonaws.com/orders/abc123.json?token=longsecret...
              </p>
            </div>
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-950/10 p-4">
              <span className="font-bold text-emerald-400 block mb-2">✅ Prompt Optimisé (32 Tokens) :</span>
              <p className="text-emerald-200 whitespace-pre-wrap leading-relaxed font-semibold">
                write a summary for order id-1001 created at 2024-03-15 14:32 with file s3://abc123.json
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Cards Section */}
      <section className="mx-auto max-w-7xl px-6 py-16 border-t border-slate-900">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-800/80 bg-slate-900/40 p-6">
            <div className="text-2xl mb-3">🏷️</div>
            <h3 className="text-lg font-bold text-white">Remplacement UUID & Handles</h3>
            <p className="mt-2 text-sm text-slate-400 leading-relaxed">
              Vos identifiants longs et complexes (36 caractères) sont convertis en handles compacts sans perte d'information logique.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800/80 bg-slate-900/40 p-6">
            <div className="text-2xl mb-3">🧹</div>
            <h3 className="text-lg font-bold text-white">Nettoyage Unicode & Invisibles</h3>
            <p className="mt-2 text-sm text-slate-400 leading-relaxed">
              Suppression des espaces de largeur nulle (zero-width spaces), normalisation des guillemets exotiques et des retours chariot multiples.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800/80 bg-slate-900/40 p-6">
            <div className="text-2xl mb-3">⚡</div>
            <h3 className="text-lg font-bold text-white">Multi-Modèles LLM</h3>
            <p className="mt-2 text-sm text-slate-400 leading-relaxed">
              Prêt pour GPT-4o, Claude 3.5 Sonnet, Gemini 1.5 Pro avec calcul direct des économies financières et de bande passante.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
