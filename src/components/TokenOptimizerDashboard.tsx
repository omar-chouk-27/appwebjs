"use client";

import { useState } from "react";
import AdminUserManagement, { UserData } from "./admin/AdminUserManagement";
import AdminSessionLogs, { LogSessionItem } from "./admin/AdminSessionLogs";
import AdminAnalyticsCharts from "./admin/AdminAnalyticsCharts";

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
  userId?: string | null;
  adminId?: string | null;
  user?: {
    id: string;
    name: string;
    surname: string;
    email: string;
    role?: string;
  } | null;
  admin?: {
    id: string;
    name: string;
    surname: string;
    email: string;
  } | null;
}

interface TokenOptimizerProps {
  models: Model[];
  initialSessions: OptimizationSession[];
  initialUsers?: UserData[];
  currentUser: {
    id: string;
    name: string;
    surname: string;
    email: string;
    role: string;
    isAdmin: boolean;
    totalPrompts: number;
    tokenQuota?: number;
    tokensUsed?: number;
  };
}

export default function TokenOptimizerDashboard({
  models,
  initialSessions,
  initialUsers = [],
  currentUser,
}: TokenOptimizerProps) {
  const [sessions, setSessions] = useState<OptimizationSession[]>(initialSessions);
  const [users, setUsers] = useState<UserData[]>(initialUsers);
  const [selectedModelId, setSelectedModelId] = useState(models[0]?.id || "");
  const [language, setLanguage] = useState("English");
  const [rawPrompt, setRawPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<
    "admin-analytics" | "admin-users" | "admin-logs" | "optimizer" | "portfolio"
  >(currentUser.isAdmin ? "admin-analytics" : "optimizer");

  const [copied, setCopied] = useState(false);
  const [selectedUserIdForLogs, setSelectedUserIdForLogs] = useState<string | null>(null);

  // User quotas
  const [userTokensUsed, setUserTokensUsed] = useState(currentUser.tokensUsed || 0);
  const userTokenQuota = currentUser.tokenQuota || 10000;

  const [lastResult, setLastResult] = useState<{
    opt_prompt: string;
    tokensSaved: number;
    savingsPercentage: number;
    rawTokensEstimate: number;
    optTokensEstimate: number;
  } | null>(null);

  // Moteur d'optimisation options
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

      if (!currentUser.isAdmin && data.metrics?.optTokensEstimate) {
        setUserTokensUsed((prev) => prev + data.metrics.optTokensEstimate);
      }
    } catch {
      setError("Erreur réseau lors de la communication avec le serveur.");
    } finally {
      setLoading(false);
    }
  }

  function handleCopy(text: string) {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleViewUserLogs(userId: string) {
    setSelectedUserIdForLogs(userId);
    setActiveTab("admin-logs");
  }

  const totalTokensSaved = sessions.reduce((acc, s) => acc + (s.tokensSaved || 0), 0);
  const avgSavings = sessions.length > 0 ? Math.round(totalTokensSaved / sessions.length) : 0;

  // Quota percentage for regular user
  const userQuotaPct = Math.min(100, Math.round((userTokensUsed / Math.max(1, userTokenQuota)) * 100));
  const isNearQuota = userQuotaPct >= 80;
  const isOverQuota = userQuotaPct >= 100;

  return (
    <div className="space-y-8">
      {/* Global Quick KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 shadow-lg backdrop-blur-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            {currentUser.isAdmin ? "Total Sessions Traitées" : "Sessions Réalisées"}
          </p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white">{sessions.length}</span>
            <span className="text-xs text-slate-500">requêtes</span>
          </div>
        </div>

        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-5 shadow-lg backdrop-blur-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
            Tokens Économisés
          </p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-emerald-300">
              +{totalTokensSaved.toLocaleString()}
            </span>
            <span className="text-xs text-emerald-400/80">tokens</span>
          </div>
        </div>

        <div className="rounded-2xl border border-cyan-500/30 bg-cyan-950/20 p-5 shadow-lg backdrop-blur-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-cyan-400">
            Gain Moyen / Requête
          </p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-cyan-300">~{avgSavings}</span>
            <span className="text-xs text-cyan-400/80">tokens / prompt</span>
          </div>
        </div>

        <div className="rounded-2xl border border-indigo-500/30 bg-indigo-950/20 p-5 shadow-lg backdrop-blur-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-indigo-400">
            Économie Estimée ($)
          </p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-indigo-300">
              ${((totalTokensSaved / 1000) * 0.005).toFixed(3)}
            </span>
            <span className="text-xs text-indigo-400/80">USD</span>
          </div>
        </div>
      </div>

      {/* Tabs navigation */}
      <div className="flex flex-wrap border-b border-slate-800 gap-2 sm:gap-6 text-sm font-medium">
        {currentUser.isAdmin && (
          <>
            <button
              onClick={() => setActiveTab("admin-analytics")}
              className={`pb-3 transition flex items-center gap-2 ${
                activeTab === "admin-analytics"
                  ? "border-b-2 border-indigo-500 text-indigo-400 font-bold"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <span>📈</span> Graphiques & Vue Globale
            </button>

            <button
              onClick={() => setActiveTab("admin-users")}
              className={`pb-3 transition flex items-center gap-2 ${
                activeTab === "admin-users"
                  ? "border-b-2 border-indigo-500 text-indigo-400 font-bold"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <span>👥</span> Gestion Utilisateurs & Quotas ({users.length})
            </button>

            <button
              onClick={() => setActiveTab("admin-logs")}
              className={`pb-3 transition flex items-center gap-2 ${
                activeTab === "admin-logs"
                  ? "border-b-2 border-indigo-500 text-indigo-400 font-bold"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <span>📜</span> Logs Détaillés ({sessions.length})
            </button>
          </>
        )}

        <button
          onClick={() => setActiveTab("optimizer")}
          className={`pb-3 transition flex items-center gap-2 ${
            activeTab === "optimizer"
              ? "border-b-2 border-indigo-500 text-indigo-400 font-bold"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <span>⚡</span> Optimiseur Rapide
        </button>

        <button
          onClick={() => setActiveTab("portfolio")}
          className={`pb-3 transition flex items-center gap-2 ${
            activeTab === "portfolio"
              ? "border-b-2 border-indigo-500 text-indigo-400 font-bold"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <span>📊</span> Historique Récent
        </button>
      </div>

      {/* TAB 1: ADMIN ANALYTICS & CHARTS */}
      {currentUser.isAdmin && activeTab === "admin-analytics" && (
        <AdminAnalyticsCharts users={users} sessions={sessions as LogSessionItem[]} />
      )}

      {/* TAB 2: ADMIN USER MANAGEMENT */}
      {currentUser.isAdmin && activeTab === "admin-users" && (
        <AdminUserManagement
          users={users}
          onUserCreated={(newUser) => setUsers([newUser, ...users])}
          onUserUpdated={(updatedUser) =>
            setUsers(users.map((u) => (u.id === updatedUser.id ? updatedUser : u)))
          }
          onUserDeleted={(deletedId) => setUsers(users.filter((u) => u.id !== deletedId))}
          onViewUserLogs={handleViewUserLogs}
        />
      )}

      {/* TAB 3: ADMIN DETAILED LOGS */}
      {currentUser.isAdmin && activeTab === "admin-logs" && (
        <AdminSessionLogs
          sessions={sessions as LogSessionItem[]}
          selectedUserId={selectedUserIdForLogs}
          onClearUserFilter={() => setSelectedUserIdForLogs(null)}
          onSessionDeleted={(delId) => setSessions(sessions.filter((s) => s.id !== delId))}
        />
      )}

      {/* TAB 4: FAST TOKEN OPTIMIZER (for both Admin & User) */}
      {activeTab === "optimizer" && (
        <div className="space-y-6">
          {/* User Quota Banner for standard users */}
          {!currentUser.isAdmin && (
            <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4 shadow-md">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="font-semibold text-slate-300">
                  Votre Quota de Tokens :
                </span>
                <span className="font-mono text-slate-200">
                  {userTokensUsed.toLocaleString()} /{" "}
                  <strong className="text-indigo-300">{userTokenQuota.toLocaleString()}</strong> tokens
                  ({userQuotaPct}%)
                </span>
              </div>
              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-800">
                <div
                  className={`h-full transition-all duration-300 ${
                    isOverQuota
                      ? "bg-red-500"
                      : isNearQuota
                      ? "bg-amber-400"
                      : "bg-gradient-to-r from-emerald-500 to-indigo-500"
                  }`}
                  style={{ width: `${userQuotaPct}%` }}
                />
              </div>
              {isOverQuota && (
                <p className="mt-2 text-xs text-red-400">
                  ⚠️ Votre quota est épuisé. Veuillez contacter votre administrateur pour augmenter votre limite.
                </p>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
            {/* Main Optimizer Panel (8 cols) */}
            <div className="lg:col-span-8 rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow-xl backdrop-blur-sm space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <span>🚀</span> Fast Token Optimisation Method
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Supprime le bruit, les UUIDs et les structures de prompt verbeuses
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                      Modèle cible
                    </label>
                    <select
                      value={selectedModelId}
                      onChange={(e) => setSelectedModelId(e.target.value)}
                      className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs font-semibold text-slate-200 focus:border-indigo-500 focus:outline-none"
                    >
                      {models.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name} ({m.provider})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                      Langue
                    </label>
                    <select
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                      className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs font-semibold text-slate-200 focus:border-indigo-500 focus:outline-none"
                    >
                      <option value="English">English</option>
                      <option value="Français">Français</option>
                      <option value="Español">Español</option>
                    </select>
                  </div>
                </div>
              </div>

              {error && (
                <div className="rounded-lg border border-red-500/30 bg-red-950/40 p-3 text-xs text-red-300">
                  {error}
                </div>
              )}

              <form onSubmit={handleOptimize} className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                      Prompt Brut (Input) :
                    </label>
                    <button
                      type="button"
                      onClick={() =>
                        setRawPrompt(
                          "Can you please help me to write a very detailed and comprehensive summary of customer order 550e8400-e29b-41d4-a716-446655440000 registered at 2024-03-15T14:32:45.123Z with attachment https://files.s3.amazonaws.com/orders/report_final.json?X-Amz-Signature=abc123longtoken987654321..."
                        )
                      }
                      className="text-[11px] text-indigo-400 hover:text-indigo-300 underline"
                    >
                      Exemple de prompt lourd
                    </button>
                  </div>
                  <textarea
                    required
                    rows={6}
                    value={rawPrompt}
                    onChange={(e) => setRawPrompt(e.target.value)}
                    placeholder="Collez ou rédigez votre prompt ici..."
                    className="w-full rounded-xl border border-slate-700 bg-slate-950/80 p-3.5 font-mono text-xs text-slate-200 placeholder-slate-600 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setRawPrompt("");
                      setLastResult(null);
                    }}
                    className="rounded-lg border border-slate-700 px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition"
                  >
                    Effacer
                  </button>
                  <button
                    disabled={loading}
                    className="rounded-lg bg-gradient-to-r from-indigo-600 to-cyan-500 px-6 py-2.5 text-xs font-bold text-white shadow-lg shadow-indigo-600/30 hover:opacity-90 transition disabled:opacity-50"
                  >
                    {loading ? "Optimisation en cours..." : "✨ Optimiser les Tokens"}
                  </button>
                </div>
              </form>

              {/* Résultat optimisé */}
              {lastResult && (
                <div className="rounded-xl border border-indigo-500/30 bg-slate-950 p-5 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                      <span className="font-bold text-xs uppercase tracking-wider text-emerald-400">
                        Prompt Optimisé
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-xs font-bold text-emerald-400 border border-emerald-500/30">
                        -{lastResult.savingsPercentage}% de Tokens
                      </span>
                      <button
                        onClick={() => handleCopy(lastResult.opt_prompt)}
                        className="rounded border border-slate-700 bg-slate-900 px-3 py-1 text-xs text-slate-300 hover:text-white"
                      >
                        {copied ? "Copié !" : "Copier"}
                      </button>
                    </div>
                  </div>

                  <pre className="whitespace-pre-wrap font-mono text-xs text-slate-200 leading-relaxed bg-slate-900/60 p-3 rounded-lg border border-slate-800">
                    {lastResult.opt_prompt}
                  </pre>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                    <span>
                      Tokens avant : <strong>{lastResult.rawTokensEstimate}</strong>
                    </span>
                    <span>
                      Tokens après :{" "}
                      <strong className="text-emerald-400">{lastResult.optTokensEstimate}</strong>
                    </span>
                    <span>
                      Économie :{" "}
                      <strong className="text-cyan-400">+{lastResult.tokensSaved} tokens</strong>
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Configuration Rules Panel (4 cols) */}
            <div className="lg:col-span-4 rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow-xl backdrop-blur-sm space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
                <span>⚙️</span> Techniques Actives
              </h3>
              <p className="text-xs text-slate-400">
                Personnalisez les filtres appliqués lors de la compression de vos requêtes :
              </p>

              <div className="space-y-2.5 text-xs text-slate-300">
                <label className="flex items-start gap-2.5 rounded-lg border border-slate-800 bg-slate-950/60 p-2.5 cursor-pointer hover:border-slate-700">
                  <input
                    type="checkbox"
                    checked={options.replaceUuids}
                    onChange={(e) => setOptions({ ...options, replaceUuids: e.target.checked })}
                    className="rounded text-indigo-600 mt-0.5"
                  />
                  <div>
                    <span className="font-semibold block text-slate-200">UUIDs → Short IDs</span>
                    <span className="text-[11px] text-slate-500">
                      Remplace les UUID 36 car. par des handles courts
                    </span>
                  </div>
                </label>

                <label className="flex items-start gap-2.5 rounded-lg border border-slate-800 bg-slate-950/60 p-2.5 cursor-pointer hover:border-slate-700">
                  <input
                    type="checkbox"
                    checked={options.shortenUrls}
                    onChange={(e) => setOptions({ ...options, shortenUrls: e.target.checked })}
                    className="rounded text-indigo-600 mt-0.5"
                  />
                  <div>
                    <span className="font-semibold block text-slate-200">Raccourcir les URLs</span>
                    <span className="text-[11px] text-slate-500">
                      Tronque les tokens de signature et paramètres inutiles
                    </span>
                  </div>
                </label>

                <label className="flex items-start gap-2.5 rounded-lg border border-slate-800 bg-slate-950/60 p-2.5 cursor-pointer hover:border-slate-700">
                  <input
                    type="checkbox"
                    checked={options.reduceTimestamps}
                    onChange={(e) => setOptions({ ...options, reduceTimestamps: e.target.checked })}
                    className="rounded text-indigo-600 mt-0.5"
                  />
                  <div>
                    <span className="font-semibold block text-slate-200">Simplifier Horodatages</span>
                    <span className="text-[11px] text-slate-500">
                      Supprime millisecondes et formats ISO verbeux
                    </span>
                  </div>
                </label>

                <label className="flex items-start gap-2.5 rounded-lg border border-slate-800 bg-slate-950/60 p-2.5 cursor-pointer hover:border-slate-700">
                  <input
                    type="checkbox"
                    checked={options.normalizeWhitespace}
                    onChange={(e) => setOptions({ ...options, normalizeWhitespace: e.target.checked })}
                    className="rounded text-indigo-600 mt-0.5"
                  />
                  <div>
                    <span className="font-semibold block text-slate-200">Normaliser Espaces</span>
                    <span className="text-[11px] text-slate-500">
                      Fusionne espaces multiples et sauts excessifs
                    </span>
                  </div>
                </label>

                <label className="flex items-start gap-2.5 rounded-lg border border-slate-800 bg-slate-950/60 p-2.5 cursor-pointer hover:border-slate-700">
                  <input
                    type="checkbox"
                    checked={options.removeRedundancy}
                    onChange={(e) => setOptions({ ...options, removeRedundancy: e.target.checked })}
                    className="rounded text-indigo-600 mt-0.5"
                  />
                  <div>
                    <span className="font-semibold block text-slate-200">Anti-Redondance</span>
                    <span className="text-[11px] text-slate-500">
                      Élimine politesse et préfixes répétés
                    </span>
                  </div>
                </label>

                <label className="flex items-start gap-2.5 rounded-lg border border-slate-800 bg-slate-950/60 p-2.5 cursor-pointer hover:border-slate-700">
                  <input
                    type="checkbox"
                    checked={options.cleanUnicode}
                    onChange={(e) => setOptions({ ...options, cleanUnicode: e.target.checked })}
                    className="rounded text-indigo-600 mt-0.5"
                  />
                  <div>
                    <span className="font-semibold block text-slate-200">Nettoyage Unicode</span>
                    <span className="text-[11px] text-slate-500">
                      Supprime zero-width spaces et smart quotes
                    </span>
                  </div>
                </label>

                <label className="flex items-start gap-2.5 rounded-lg border border-slate-800 bg-slate-950/60 p-2.5 cursor-pointer hover:border-slate-700">
                  <input
                    type="checkbox"
                    checked={options.stripBase64}
                    onChange={(e) => setOptions({ ...options, stripBase64: e.target.checked })}
                    className="rounded text-indigo-600 mt-0.5"
                  />
                  <div>
                    <span className="font-semibold block text-slate-200">Extraction Base64</span>
                    <span className="text-[11px] text-slate-500">
                      Retire les blocs de données brutes d'image
                    </span>
                  </div>
                </label>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: PORTFOLIO / HISTORIQUE */}
      {activeTab === "portfolio" && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow-xl backdrop-blur-sm">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-lg font-bold text-white">📊 Portfolio d'Optimisation</h2>
              <p className="text-xs text-slate-400">
                Suivi de vos gains de tokens et sessions récentes
              </p>
            </div>
          </div>

          {sessions.length === 0 ? (
            <div className="p-12 text-center text-slate-500 text-sm">
              Aucune session enregistrée pour le moment.
            </div>
          ) : (
            <div className="space-y-4">
              {sessions.map((s) => (
                <div
                  key={s.id}
                  className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 transition hover:border-slate-700"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/60 pb-2.5 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-indigo-300">
                        {s.model?.name || "Modèle Standard"}
                      </span>
                      <span className="text-slate-600">•</span>
                      <span className="text-slate-400">
                        {new Date(s.time).toLocaleDateString("fr-FR")} à{" "}
                        {new Date(s.time).toLocaleTimeString("fr-FR")}
                      </span>
                    </div>

                    <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-bold text-emerald-400 border border-emerald-500/20">
                      +{s.tokensSaved} tokens économisés
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3 text-xs">
                    <div className="rounded-lg bg-slate-900/80 p-3 border border-slate-800/80">
                      <span className="font-bold text-slate-500 block mb-1">Prompt Brut :</span>
                      <p className="font-mono text-slate-400 whitespace-pre-wrap line-clamp-3">
                        {s.raw_prompt}
                      </p>
                    </div>

                    <div className="rounded-lg bg-indigo-950/30 p-3 border border-indigo-500/20">
                      <span className="font-bold text-indigo-400 block mb-1">
                        Prompt Optimisé :
                      </span>
                      <p className="font-mono text-emerald-200 whitespace-pre-wrap line-clamp-3">
                        {s.opt_prompt}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
