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

  const inputCls =
    "w-full rounded-lg border border-slate-700 bg-slate-950/70 p-3 text-sm text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500";

  return (
    <form onSubmit={onSubmit} className="flex w-full flex-col gap-4">
      {mode === "register" && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Prénom</label>
            <input name="name" placeholder="John" required className={inputCls} />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Nom</label>
            <input name="surname" placeholder="Doe" required className={inputCls} />
          </div>
        </div>
      )}

      <div>
        <label className="block text-xs font-medium text-slate-400 mb-1">Adresse Email</label>
        <input
          name="email"
          type="email"
          placeholder="nom@exemple.com"
          required
          className={inputCls}
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-400 mb-1">Mot de passe</label>
        <input
          name="password"
          type="password"
          placeholder="••••••••"
          required
          className={inputCls}
        />
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-950/40 p-3 text-xs text-red-300">
          {error}
        </div>
      )}

      <button
        disabled={loading}
        className="mt-2 w-full rounded-lg bg-gradient-to-r from-indigo-600 to-cyan-500 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-600/30 hover:opacity-90 transition disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading
          ? "Traitement..."
          : mode === "login"
          ? "Se Connecter"
          : "Créer mon Compte"}
      </button>
    </form>
  );
}
