"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AuthForm({
  mode,
}: {
  mode: "login" | "register";
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const data = Object.fromEntries(new FormData(e.currentTarget));
    const res = await fetch(`/api/auth/${mode}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    setLoading(false);

    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setError(j.error ?? "Une erreur est survenue");
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  const cls = "w-full rounded border border-slate-300 bg-white p-2";

  return (
    <form onSubmit={onSubmit} className="flex w-full max-w-sm flex-col gap-3">
      {mode === "register" && (
        <input name="name" placeholder="Nom" required className={cls} />
      )}
      <input
        name="email"
        type="email"
        placeholder="Email"
        required
        className={cls}
      />
      <input
        name="password"
        type="password"
        placeholder="Mot de passe"
        required
        className={cls}
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        disabled={loading}
        className="rounded bg-slate-900 px-4 py-2 font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "Patientez..." : mode === "login" ? "Se connecter" : "S'inscrire"}
      </button>
    </form>
  );
}
