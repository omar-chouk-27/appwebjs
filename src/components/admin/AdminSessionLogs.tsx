"use client";

import { useState } from "react";

export interface LogSessionItem {
  id: string;
  raw_prompt: string;
  opt_prompt: string;
  language: string;
  time: string;
  tokensSaved: number;
  model: {
    id: string;
    name: string;
    provider: string;
  };
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

interface AdminSessionLogsProps {
  sessions: LogSessionItem[];
  selectedUserId?: string | null;
  onClearUserFilter?: () => void;
  onSessionDeleted?: (sessionId: string) => void;
}

export default function AdminSessionLogs({
  sessions: initialSessions,
  selectedUserId,
  onClearUserFilter,
  onSessionDeleted,
}: AdminSessionLogsProps) {
  const [sessions, setSessions] = useState<LogSessionItem[]>(initialSessions);
  const [search, setSearch] = useState("");
  const [modelFilter, setModelFilter] = useState("all");
  const [selectedSession, setSelectedSession] = useState<LogSessionItem | null>(null);
  const [copiedRaw, setCopiedRaw] = useState(false);
  const [copiedOpt, setCopiedOpt] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Sync prop updates
  if (initialSessions !== sessions && initialSessions.length !== sessions.length) {
    setSessions(initialSessions);
  }

  // Extract unique models
  const modelOptions = Array.from(
    new Set(sessions.map((s) => s.model?.name).filter(Boolean))
  );

  // Filter sessions
  const filtered = sessions.filter((s) => {
    // User filter
    if (selectedUserId && s.userId !== selectedUserId) {
      return false;
    }

    // Model filter
    if (modelFilter !== "all" && s.model?.name !== modelFilter) {
      return false;
    }

    // Search filter
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchPrompt =
        s.raw_prompt.toLowerCase().includes(q) ||
        s.opt_prompt.toLowerCase().includes(q);
      const matchUser =
        s.user &&
        (`${s.user.name} ${s.user.surname} ${s.user.email}`.toLowerCase().includes(q));
      const matchAdmin =
        s.admin &&
        (`${s.admin.name} ${s.admin.surname} ${s.admin.email}`.toLowerCase().includes(q));
      const matchModel = s.model && s.model.name.toLowerCase().includes(q);

      return matchPrompt || matchUser || matchAdmin || matchModel;
    }

    return true;
  });

  async function handleDelete(id: string) {
    if (!confirm("Voulez-vous vraiment supprimer cet enregistrement de log ?")) return;

    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/sessions/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Erreur lors de la suppression");
        return;
      }
      setSessions(sessions.filter((s) => s.id !== id));
      if (selectedSession?.id === id) {
        setSelectedSession(null);
      }
      if (onSessionDeleted) onSessionDeleted(id);
    } catch {
      alert("Erreur de connexion");
    } finally {
      setDeletingId(null);
    }
  }

  function handleCopy(text: string, type: "raw" | "opt") {
    navigator.clipboard.writeText(text);
    if (type === "raw") {
      setCopiedRaw(true);
      setTimeout(() => setCopiedRaw(false), 2000);
    } else {
      setCopiedOpt(true);
      setTimeout(() => setCopiedOpt(false), 2000);
    }
  }

  return (
    <div className="space-y-6">
      {/* Active User Filter Notification */}
      {selectedUserId && (
        <div className="flex items-center justify-between rounded-xl border border-indigo-500/30 bg-indigo-950/40 px-4 py-3 text-sm text-indigo-200">
          <div className="flex items-center gap-2">
            <span>🔍 Filtré pour un utilisateur spécifique</span>
          </div>
          {onClearUserFilter && (
            <button
              onClick={onClearUserFilter}
              className="rounded-lg bg-indigo-600 px-3 py-1 text-xs font-semibold text-white hover:bg-indigo-500"
            >
              Afficher tous les utilisateurs
            </button>
          )}
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-900/80 p-4">
        <div className="flex flex-1 flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[240px]">
            <input
              type="text"
              placeholder="Rechercher dans les prompts, utilisateurs ou modèles..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-2.5 top-2.5 text-xs text-slate-400 hover:text-white"
              >
                ✕
              </button>
            )}
          </div>

          <select
            value={modelFilter}
            onChange={(e) => setModelFilter(e.target.value)}
            className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-300 focus:border-indigo-500 focus:outline-none"
          >
            <option value="all">Tous les modèles ({sessions.length})</option>
            {modelOptions.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </div>

        <div className="text-xs font-mono text-slate-400">
          {filtered.length} log{filtered.length > 1 ? "s" : ""} trouvé{filtered.length > 1 ? "s" : ""}
        </div>
      </div>

      {/* Sessions List */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-12 text-center text-slate-500">
          Aucun log d'optimisation ne correspond à vos filtres.
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((s) => {
            const charBefore = s.raw_prompt.length;
            const charAfter = s.opt_prompt.length;
            const charDiffPct = charBefore > 0 ? Math.round(((charBefore - charAfter) / charBefore) * 100) : 0;

            return (
              <div
                key={s.id}
                className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 transition hover:border-slate-700"
              >
                {/* Header Row */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    {/* User / Admin Tag */}
                    {s.user ? (
                      <div className="flex items-center gap-1.5 rounded-full bg-blue-950/80 border border-blue-800/50 px-2.5 py-0.5 text-blue-300">
                        <span className="font-semibold">
                          {s.user.name} {s.user.surname}
                        </span>
                        <span className="text-[10px] text-blue-400">({s.user.email})</span>
                      </div>
                    ) : s.admin ? (
                      <div className="flex items-center gap-1.5 rounded-full bg-purple-950/80 border border-purple-800/50 px-2.5 py-0.5 text-purple-300">
                        <span className="font-bold">ADMIN : {s.admin.name}</span>
                        <span className="text-[10px] text-purple-400">({s.admin.email})</span>
                      </div>
                    ) : (
                      <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[11px] text-slate-400">
                        Utilisateur anonyme
                      </span>
                    )}

                    <span className="text-slate-600">•</span>

                    {/* Model */}
                    <span className="rounded bg-indigo-950/70 border border-indigo-800/40 px-2 py-0.5 text-[11px] font-mono text-indigo-300">
                      {s.model?.name || "Modèle inconnu"} ({s.model?.provider || "IA"})
                    </span>

                    <span className="text-slate-600">•</span>

                    {/* Timestamp */}
                    <span className="text-slate-400">
                      {new Date(s.time).toLocaleDateString("fr-FR")} à{" "}
                      {new Date(s.time).toLocaleTimeString("fr-FR")}
                    </span>
                  </div>

                  {/* Savings & Actions */}
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 text-xs font-bold text-emerald-400">
                      +{s.tokensSaved} tokens économisés ({charDiffPct}%)
                    </span>
                    <button
                      onClick={() => setSelectedSession(s)}
                      className="rounded-lg bg-indigo-600/20 border border-indigo-500/40 px-2.5 py-1 text-xs font-medium text-indigo-300 hover:bg-indigo-600/40 transition"
                    >
                      Détails complets
                    </button>
                    <button
                      onClick={() => handleDelete(s.id)}
                      disabled={deletingId === s.id}
                      className="rounded-lg border border-red-900/50 bg-red-950/30 px-2 py-1 text-xs text-red-400 hover:bg-red-900/50 transition disabled:opacity-50"
                      title="Supprimer ce log"
                    >
                      🗑️
                    </button>
                  </div>
                </div>

                {/* Prompt Preview comparison */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3 text-xs">
                  <div className="rounded-lg bg-slate-950/70 p-3 border border-slate-800/80">
                    <div className="flex items-center justify-between text-slate-400 mb-1 font-semibold text-[11px]">
                      <span>Prompt Brut ({charBefore} caractères)</span>
                    </div>
                    <p className="font-mono text-slate-300 line-clamp-2 whitespace-pre-wrap">
                      {s.raw_prompt}
                    </p>
                  </div>

                  <div className="rounded-lg bg-indigo-950/20 p-3 border border-indigo-800/30">
                    <div className="flex items-center justify-between text-indigo-300 mb-1 font-semibold text-[11px]">
                      <span>Prompt Optimisé ({charAfter} caractères)</span>
                    </div>
                    <p className="font-mono text-emerald-300 line-clamp-2 whitespace-pre-wrap">
                      {s.opt_prompt}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Detailed Inspection Modal */}
      {selectedSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-md">
          <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl animate-in fade-in zoom-in-95">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-800 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-white">Détails Complets du Log</h3>
                  <span className="rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 text-xs font-bold text-emerald-400">
                    +{selectedSession.tokensSaved} tokens gagnés
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1 font-mono">
                  ID: {selectedSession.id}
                </p>
              </div>
              <button
                onClick={() => setSelectedSession(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* Metadata Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-4">
              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
                <span className="block text-[11px] font-semibold text-slate-400 uppercase">Utilisateur</span>
                <span className="mt-1 block text-sm font-semibold text-white truncate">
                  {selectedSession.user
                    ? `${selectedSession.user.name} ${selectedSession.user.surname}`
                    : selectedSession.admin
                    ? `Admin (${selectedSession.admin.name})`
                    : "Non spécifié"}
                </span>
                <span className="text-[11px] text-slate-400 truncate block">
                  {selectedSession.user?.email || selectedSession.admin?.email || "-"}
                </span>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
                <span className="block text-[11px] font-semibold text-slate-400 uppercase">Modèle IA</span>
                <span className="mt-1 block text-sm font-semibold text-indigo-300">
                  {selectedSession.model?.name || "-"}
                </span>
                <span className="text-[11px] text-slate-400 block">
                  {selectedSession.model?.provider || "-"}
                </span>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
                <span className="block text-[11px] font-semibold text-slate-400 uppercase">Date & Heure</span>
                <span className="mt-1 block text-sm font-semibold text-white">
                  {new Date(selectedSession.time).toLocaleDateString("fr-FR")}
                </span>
                <span className="text-[11px] text-slate-400 block">
                  {new Date(selectedSession.time).toLocaleTimeString("fr-FR")}
                </span>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
                <span className="block text-[11px] font-semibold text-slate-400 uppercase">Langue</span>
                <span className="mt-1 block text-sm font-semibold text-white">
                  {selectedSession.language}
                </span>
                <span className="text-[11px] text-emerald-400 block font-semibold">
                  {Math.round(
                    ((selectedSession.raw_prompt.length - selectedSession.opt_prompt.length) /
                      Math.max(1, selectedSession.raw_prompt.length)) *
                      100
                  )}
                  % compression
                </span>
              </div>
            </div>

            {/* Prompt Breakdown */}
            <div className="space-y-4">
              {/* Raw Prompt */}
              <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Prompt Brut ({selectedSession.raw_prompt.length} caractères)
                  </span>
                  <button
                    onClick={() => handleCopy(selectedSession.raw_prompt, "raw")}
                    className="rounded border border-slate-700 bg-slate-800 px-2 py-1 text-xs text-slate-300 hover:bg-slate-700"
                  >
                    {copiedRaw ? "Copié !" : "Copier le brut"}
                  </button>
                </div>
                <div className="max-h-60 overflow-y-auto rounded-lg bg-slate-900/90 p-3 font-mono text-xs text-slate-200 whitespace-pre-wrap select-all">
                  {selectedSession.raw_prompt}
                </div>
              </div>

              {/* Optimized Prompt */}
              <div className="rounded-xl border border-indigo-800/40 bg-indigo-950/20 p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
                    Prompt Optimisé ({selectedSession.opt_prompt.length} caractères)
                  </span>
                  <button
                    onClick={() => handleCopy(selectedSession.opt_prompt, "opt")}
                    className="rounded border border-indigo-700/60 bg-indigo-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-indigo-500 shadow"
                  >
                    {copiedOpt ? "Copié !" : "Copier l'optimisé"}
                  </button>
                </div>
                <div className="max-h-60 overflow-y-auto rounded-lg bg-slate-950/90 p-3 font-mono text-xs text-emerald-300 whitespace-pre-wrap select-all border border-emerald-900/30">
                  {selectedSession.opt_prompt}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="mt-6 flex items-center justify-between border-t border-slate-800 pt-4">
              <button
                onClick={() => handleDelete(selectedSession.id)}
                className="rounded-lg border border-red-900/60 bg-red-950/40 px-3 py-1.5 text-xs font-semibold text-red-400 hover:bg-red-900/60"
              >
                Supprimer cet enregistrement
              </button>

              <button
                onClick={() => setSelectedSession(null)}
                className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-700"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
