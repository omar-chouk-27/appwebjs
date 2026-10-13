import Link from "next/link";
import AuthForm from "@/components/AuthForm";

export default function RegisterPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col items-center justify-center gap-4 px-6">
      <h1 className="text-2xl font-bold">Créer un compte</h1>
      <AuthForm mode="register" />
      <Link href="/login" className="text-sm text-slate-600 underline">
        J'ai déjà un compte
      </Link>
    </main>
  );
}
