import Link from "next/link";
import AuthForm from "@/components/AuthForm";

export default function RegisterPage() {
  return (
    <main className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden bg-slate-950 px-6 py-12">
      {/* Background glow */}
      <div className="pointer-events-none absolute -top-32 left-1/2 -z-10 h-[400px] w-[600px] -translate-x-1/2 rounded-full bg-cyan-600/20 blur-[130px]" />

      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex items-center gap-2 font-mono text-xl font-bold text-white mb-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white font-black text-sm">
              ⚡
            </span>
            Token<span className="text-indigo-400">Opt</span>
          </Link>
          <h1 className="text-2xl font-extrabold tracking-tight text-white">Créer un compte TokenOpt</h1>
          <p className="text-sm text-slate-400">
            Commencez à optimiser vos prompts dès aujourd'hui.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-8 shadow-2xl backdrop-blur-md">
          <AuthForm mode="register" />
        </div>

        <p className="text-center text-sm text-slate-400">
          Vous avez déjà un compte ?{" "}
          <Link href="/login" className="font-semibold text-indigo-400 hover:text-indigo-300 underline underline-offset-4">
            Se connecter
          </Link>
        </p>
      </div>
    </main>
  );
}
