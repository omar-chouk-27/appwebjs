import Link from "next/link";
import AuthForm from "@/components/AuthForm";

export default function LoginPage() {
  return (
    <main className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden bg-slate-950 px-6 py-12">
      {/* Background glow */}
      <div className="pointer-events-none absolute -top-32 left-1/2 -z-10 h-[400px] w-[600px] -translate-x-1/2 rounded-full bg-indigo-600/20 blur-[130px]" />

      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex items-center gap-2 font-mono text-xl font-bold text-white mb-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white font-black text-sm">
              ⚡
            </span>
            Token<span className="text-indigo-400">Opt</span>
          </Link>
          <h1 className="text-2xl font-extrabold tracking-tight text-white">Connexion à votre espace</h1>
          <p className="text-sm text-slate-400">
            Accédez à vos sessions d'optimisation de prompts et modèles IA.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-8 shadow-2xl backdrop-blur-md">
          <AuthForm mode="login" />

          {/* Comptes de test rapides */}
          <div className="mt-6 border-t border-slate-800 pt-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Comptes de test pré-configurés :
            </p>
            <div className="space-y-1.5 text-xs text-slate-400">
              <p>👤 <strong>Utilisateur :</strong> <code className="text-indigo-300">john@example.com</code> / <code className="text-slate-300">password123</code></p>
              <p>🛡️ <strong>Admin :</strong> <code className="text-purple-300">admin@tokenopt.com</code> / <code className="text-slate-300">password123</code></p>
            </div>
          </div>
        </div>

        <p className="text-center text-sm text-slate-400">
          Pas encore de compte ?{" "}
          <Link href="/register" className="font-semibold text-indigo-400 hover:text-indigo-300 underline underline-offset-4">
            Créer un compte
          </Link>
        </p>
      </div>
    </main>
  );
}
