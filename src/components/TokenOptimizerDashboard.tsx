"use client";

import { useState } from "react";

export interface Model {
  id: string;
  name: string;
  provider: string;
}

export interface OptimizationSession {
  id: string;
  raw_prompt: string;
  opt_prompt: string;
  language: string;
  time: string;
  tokensSaved: number;
  model: Model;
}

interface TokenOptimizerProps {
  models: Model[];
  initialSessions: OptimizationSession[];
  currentUser: {
    id: string;
    name: string;
    surname: string;
    email: string;
    role: string;
    isAdmin: boolean;
    totalPrompts: number;
  };
}

export default function TokenOptimizerDashboard({
  models,
  initialSessions,
  currentUser,
}: TokenOptimizerProps) {
  const [sessions, setSessions] = useState<OptimizationSession[]>(initialSessions);
  const [selectedModelId, setSelectedModelId] = useState(models[0]?.id || "");
  const [language, setLanguage] = useState("English");
  const [rawPrompt, setRawPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [lastResult, setLastResult] = useState<{
    opt_prompt: string;
    tokensSaved: number;
    savingsPercentage: number;
    rawTokensEstimate: number;
    optTokensEstimate: number;
  } | null>(null);

  // Options d'optimisation (Checklist du projet)
  const [options, setOptions] = useState({
    replaceUuids: true,
    shortenUrls: true,
    reduceTimestamps: true,
    normalizeWhitespace: true,
    cleanUnicode: true,
    stripBase64: true,
    removeRedundancy: true,
  });

  async function handleOptimize(e: React.FormEvent) {
    e.preventDefault();
    if (!rawPrompt.trim()) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/optimize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          raw_prompt: rawPrompt,
          modelId: selectedModelId,
          language,
          ...options,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Erreur lors de l'optimisation");
        return;
      }

      setLastResult(data.metrics);
      if (data.session) {
        setSessions([data.session, ...sessions]);
      }
    } catch {
      setError("Erreur réseau");
    } finally {
      setLoading(false);
    }
  }

  const totalTokensSaved = sessions.reduce((acc, s) => acc + (s.tokensSaved || 0), 0);

  return (
    <div className="space-y-8">
      {/* Statistiques Rapides */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
            Sessions d'optimisation
          </p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{sessions.length}</p>
        </div>
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-5 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wider text-emerald-800">
            Total Tokens Économisés
          </p>
          <p className="mt-2 text-3xl font-bold text-emerald-700">
            ~{totalTokensSaved.toLocaleString()}
          </p>
        </div>
        <div className="rounded-xl border border-indigo-200 bg-indigo-50/60 p-5 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wider text-indigo-800">
            Statut du compte
          </p>
          <p className="mt-2 text-xl font-bold text-indigo-900">
            {currentUser.isAdmin ? "Administrateur" : "Utilisateur"}
          </p>
          <p className="text-xs text-indigo-600 mt-1">{currentUser.email}</p>
        </div>
      </div>

      {/* Formulaire Fast Optimisation */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              ⚡ Optimiseur Rapide de Prompt
            </h2>
            <p className="text-sm text-slate-500">
              Réduction de taille, nettoyage Unicode, remplacement des UUID et suppression de la redondance.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Modèle</label>
              <select
                value={selectedModelId}
                onChange={(e) => setSelectedModelId(e.target.value)}
                className="rounded border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-800"
              >
                {models.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.provider})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Langue</label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="rounded border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-800"
              >
                <option value="English">English</option>
                <option value="Français">Français</option>
                <option value="Español">Español</option>
              </select>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleOptimize} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-2">
              Prompt Brut à optimiser :
            </label>
            <textarea
              required
              rows={5}
              value={rawPrompt}
              onChange={(e) => setRawPrompt(e.target.value)}
              placeholder="Can you please help me to write a summary for order 550e8400-e29b-41d4-a716-446655440000 created at 2024-03-15T14:32:45.123Z with file https://bucket.s3.amazonaws.com/uploads/doc.pdf?X-Amz-Security-Token=xyz..."
              className="w-full rounded-lg border border-slate-300 p-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {/* Checklist d'optimisation */}
          <div className="rounded-lg bg-slate-50 p-4 border border-slate-200">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-3">
              Règles d'optimisation actives :
            </p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 text-xs text-slate-700">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={options.replaceUuids}
                  onChange={(e) => setOptions({ ...options, replaceUuids: e.target.checked })}
                  className="rounded text-indigo-600"
                />
                UUIDs → short IDs
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={options.shortenUrls}
                  onChange={(e) => setOptions({ ...options, shortenUrls: e.target.checked })}
                  className="rounded text-indigo-600"
                />
                URLs longues → court
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={options.reduceTimestamps}
                  onChange={(e) => setOptions({ ...options, reduceTimestamps: e.target.checked })}
                  className="rounded text-indigo-600"
                />
                Timestamps simplifiés
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={options.removeRedundancy}
                  onChange={(e) => setOptions({ ...options, removeRedundancy: e.target.checked })}
                  className="rounded text-indigo-600"
                />
                Formules de politesse
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={options.normalizeWhitespace}
                  onChange={(e) => setOptions({ ...options, normalizeWhitespace: e.target.checked })}
                  className="rounded text-indigo-600"
                />
                Espaces superflus
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={options.cleanUnicode}
                  onChange={(e) => setOptions({ ...options, cleanUnicode: e.target.checked })}
                  className="rounded text-indigo-600"
                />
                Unicode invisible & quotes
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={options.stripBase64}
                  onChange={(e) => setOptions({ ...options, stripBase64: e.target.checked })}
                  className="rounded text-indigo-600"
                />
                Blobs Base64
              </label>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              disabled={loading}
              className="rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-indigo-700 disabled:opacity-50"
            >
              {loading ? "Optimisation en cours..." : "🚀 Optimiser le Prompt"}
            </button>
          </div>
        </form>

        {/* Résultat immédiat */}
        {lastResult && (
          <div className="mt-6 rounded-lg border border-indigo-200 bg-indigo-50/40 p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-bold text-indigo-950">
                ✨ Prompt Optimisé avec Succès !
              </h3>
              <div className="flex items-center gap-3">
                <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">
                  -{lastResult.savingsPercentage}% de tokens
                </span>
                <span className="text-xs text-slate-600">
                  {lastResult.rawTokensEstimate} tokens → <strong>{lastResult.optTokensEstimate} tokens</strong> ({lastResult.tokensSaved} économisés)
                </span>
              </div>
            </div>
            <div className="rounded-md bg-white p-4 border border-slate-200">
              <pre className="whitespace-pre-wrap font-sans text-sm text-slate-800">
                {lastResult.opt_prompt}
              </pre>
            </div>
          </div>
        )}
      </div>

      {/* Historique des Sessions */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-lg font-bold text-slate-900">
          📜 Historique des Sessions d'Optimisation
        </h3>

        {sessions.length === 0 ? (
          <p className="text-sm text-slate-500">Aucune session d'optimisation pour le moment.</p>
        ) : (
          <div className="space-y-4">
            {sessions.map((s) => (
              <div
                key={s.id}
                className="rounded-lg border border-slate-200 p-4 transition-all hover:border-slate-300"
              >
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-800">
                      Modèle : {s.model?.name || "Standard"}
                    </span>
                    <span>•</span>
                    <span>{new Date(s.time).toLocaleDateString("fr-FR")} à {new Date(s.time).toLocaleTimeString("fr-FR")}</span>
                  </div>
                  <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 font-bold text-emerald-700 border border-emerald-200">
                    +{s.tokensSaved} tokens sauvés
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                  <div className="rounded bg-slate-50 p-2.5 text-xs text-slate-600 border border-slate-100">
                    <span className="font-semibold text-slate-500 block mb-1">Prompt Original :</span>
                    <p className="line-clamp-3">{s.raw_prompt}</p>
                  </div>
                  <div className="rounded bg-indigo-50/50 p-2.5 text-xs text-slate-800 border border-indigo-100">
                    <span className="font-semibold text-indigo-600 block mb-1">Prompt Optimisé :</span>
                    <p className="line-clamp-3 font-medium">{s.opt_prompt}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
