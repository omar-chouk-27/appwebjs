import Link from "next/link";
import AuthForm from "@/components/AuthForm";

export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col items-center justify-center gap-4 px-6">
      <h1 className="text-2xl font-bold">Connexion</h1>
      <AuthForm mode="login" />
      <Link href="/register" className="text-sm text-slate-600 underline">
        Créer un compte
      </Link>
    </main>
  );
}
