"use client";

import { useState } from "react";

export interface UserData {
  id: string;
  name: string;
  surname: string;
  email: string;
  role: string;
  totalPrompts: number;
  tokenQuota: number;
  tokensUsed: number;
  createdAt: string;
  _count?: {
    sessions: number;
  };
}

interface AdminUserManagementProps {
  users: UserData[];
  onUserCreated?: (user: UserData) => void;
  onUserUpdated?: (user: UserData) => void;
  onUserDeleted?: (userId: string) => void;
  onViewUserLogs?: (userId: string) => void;
}

export default function AdminUserManagement({
  users: initialUsers,
  onUserCreated,
  onUserUpdated,
  onUserDeleted,
  onViewUserLogs,
}: AdminUserManagementProps) {
  const [users, setUsers] = useState<UserData[]>(initialUsers);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserData | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    surname: "",
    email: "",
    password: "",
    role: "user",
    tokenQuota: 10000,
    tokensUsed: 0,
  });
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Sync users if prop updates
  if (initialUsers !== users && initialUsers.length !== users.length) {
    setUsers(initialUsers);
  }

  // Filtered users
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.surname.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === "all" || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const totalQuota = users.reduce((acc, u) => acc + (u.tokenQuota || 0), 0);
  const totalTokensUsed = users.reduce((acc, u) => acc + (u.tokensUsed || 0), 0);

  function handleOpenCreate() {
    setEditingUser(null);
    setFormData({
      name: "",
      surname: "",
      email: "",
      password: "",
      role: "user",
      tokenQuota: 10000,
      tokensUsed: 0,
    });
    setFormError("");
    setIsModalOpen(true);
  }

  function handleOpenEdit(user: UserData) {
    setEditingUser(user);
    setFormData({
      name: user.name,
      surname: user.surname,
      email: user.email,
      password: "",
      role: user.role,
      tokenQuota: user.tokenQuota ?? 10000,
      tokensUsed: user.tokensUsed ?? 0,
    });
    setFormError("");
    setIsModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setFormError("");

    try {
      if (editingUser) {
        // Edit existing user
        const updatePayload: Record<string, unknown> = {
          name: formData.name,
          surname: formData.surname,
          email: formData.email,
          role: formData.role,
          tokenQuota: Number(formData.tokenQuota),
          tokensUsed: Number(formData.tokensUsed),
        };
        if (formData.password.trim()) {
          updatePayload.password = formData.password.trim();
        }

        const res = await fetch(`/api/admin/user/${editingUser.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updatePayload),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Erreur de mise à jour");
        }

        const updated = users.map((u) =>
          u.id === editingUser.id ? { ...u, ...updatePayload } : u
        );
        setUsers(updated as UserData[]);
        if (onUserUpdated) onUserUpdated({ ...editingUser, ...updatePayload } as UserData);
        setIsModalOpen(false);
      } else {
        // Create user
        if (!formData.password || formData.password.length < 6) {
          throw new Error("Le mot de passe doit faire au moins 6 caractères");
        }

        const res = await fetch("/api/admin/user", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: formData.name,
            surname: formData.surname,
            email: formData.email,
            password: formData.password,
            role: formData.role,
            tokenQuota: Number(formData.tokenQuota),
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Erreur lors de la création");
        }

        setUsers([data, ...users]);
        if (onUserCreated) onUserCreated(data);
        setIsModalOpen(false);
      }
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "Une erreur est survenue");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Confirmer la suppression définitive de l'utilisateur ${name} ? Tous ses logs seront supprimés.`)) {
      return;
    }

    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/user/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Erreur lors de la suppression");
        return;
      }
      setUsers(users.filter((u) => u.id !== id));
      if (onUserDeleted) onUserDeleted(id);
    } catch {
      alert("Erreur de connexion");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Utilisateurs</p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white">{users.length}</span>
            <span className="text-xs text-slate-500">comptes enregistrés</span>
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Tokens Alloués</p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-indigo-400">{totalQuota.toLocaleString()}</span>
            <span className="text-xs text-slate-500">tokens de quota global</span>
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Tokens Consommés</p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-amber-400">{totalTokensUsed.toLocaleString()}</span>
            <span className="text-xs text-slate-500">
              ({totalQuota > 0 ? Math.round((totalTokensUsed / totalQuota) * 100) : 0}% du quota)
            </span>
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-900/80 p-4">
        <div className="flex flex-1 flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <input
              type="text"
              placeholder="Rechercher par nom, prénom ou email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
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
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-300 focus:border-indigo-500 focus:outline-none"
          >
            <option value="all">Tous les rôles</option>
            <option value="user">Utilisateurs</option>
            <option value="student">Étudiants</option>
            <option value="teacher">Enseignants</option>
            <option value="admin">Administrateurs</option>
          </select>
        </div>

        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-2 text-sm font-semibold text-white shadow-md transition hover:from-indigo-500 hover:to-purple-500"
        >
          <span>+</span> Ajouter un utilisateur
        </button>
      </div>

      {/* Users Table */}
      <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/60 shadow">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="border-b border-slate-800 bg-slate-950/70 text-xs uppercase tracking-wider text-slate-400">
              <tr>
                <th className="px-5 py-3.5">Utilisateur</th>
                <th className="px-4 py-3.5">Rôle</th>
                <th className="px-4 py-3.5">Quota & Consommation</th>
                <th className="px-4 py-3.5">Prompts</th>
                <th className="px-4 py-3.5">Inscription</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">
                    Aucun utilisateur trouvé.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const quota = u.tokenQuota || 10000;
                  const used = u.tokensUsed || 0;
                  const pct = Math.min(100, Math.round((used / quota) * 100));
                  const isNearQuota = pct >= 80;
                  const isOverQuota = pct >= 100;

                  return (
                    <tr key={u.id} className="hover:bg-slate-800/30 transition">
                      {/* Name / Email */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 font-bold text-white text-xs shadow">
                            {u.name[0]?.toUpperCase() || "U"}
                            {u.surname[0]?.toUpperCase() || ""}
                          </div>
                          <div>
                            <div className="font-semibold text-white">
                              {u.name} {u.surname}
                            </div>
                            <div className="text-xs text-slate-400">{u.email}</div>
                          </div>
                        </div>
                      </td>

                      {/* Role */}
                      <td className="px-4 py-4">
                        <span className="inline-block rounded-full bg-slate-800 px-2.5 py-0.5 text-[11px] font-medium text-slate-300 border border-slate-700 capitalize">
                          {u.role}
                        </span>
                      </td>

                      {/* Token Quota & Usage Bar */}
                      <td className="px-4 py-4 min-w-[200px]">
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-mono text-slate-200">
                              {used.toLocaleString()} / <span className="text-indigo-300 font-bold">{quota.toLocaleString()}</span>
                            </span>
                            <span
                              className={`text-[11px] font-bold ${
                                isOverQuota
                                  ? "text-red-400"
                                  : isNearQuota
                                  ? "text-amber-400"
                                  : "text-emerald-400"
                              }`}
                            >
                              {pct}%
                            </span>
                          </div>

                          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
                            <div
                              className={`h-full transition-all duration-300 ${
                                isOverQuota
                                  ? "bg-red-500"
                                  : isNearQuota
                                  ? "bg-amber-400"
                                  : "bg-gradient-to-r from-emerald-500 to-indigo-500"
                              }`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>

                          {isOverQuota && (
                            <p className="text-[10px] text-red-400 font-medium">⚠️ Quota dépassé</p>
                          )}
                        </div>
                      </td>

                      {/* Prompts */}
                      <td className="px-4 py-4">
                        <span className="font-semibold text-slate-200">{u.totalPrompts || 0}</span>
                      </td>

                      {/* Created */}
                      <td className="px-4 py-4 text-xs text-slate-400">
                        {u.createdAt ? new Date(u.createdAt).toLocaleDateString("fr-FR") : "-"}
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {onViewUserLogs && (
                            <button
                              onClick={() => onViewUserLogs(u.id)}
                              title="Voir les sessions de cet utilisateur"
                              className="rounded-lg bg-indigo-950/60 border border-indigo-700/50 px-2.5 py-1 text-xs text-indigo-300 hover:bg-indigo-900/80 transition"
                            >
                              Logs
                            </button>
                          )}
                          <button
                            onClick={() => handleOpenEdit(u)}
                            className="rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1 text-xs text-slate-200 hover:bg-slate-700 transition"
                          >
                            Modifier
                          </button>
                          <button
                            onClick={() => handleDelete(u.id, `${u.name} ${u.surname}`)}
                            disabled={deletingId === u.id}
                            className="rounded-lg border border-red-900/60 bg-red-950/40 px-2.5 py-1 text-xs text-red-400 hover:bg-red-900/60 transition disabled:opacity-50"
                          >
                            {deletingId === u.id ? "..." : "Supprimer"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Add / Edit User */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white">
                {editingUser ? "Modifier l'utilisateur" : "Ajouter un nouvel utilisateur"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white text-lg font-semibold"
              >
                ✕
              </button>
            </div>

            {formError && (
              <div className="mt-4 rounded-lg bg-red-950/80 border border-red-800 p-3 text-xs text-red-200">
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Prénom *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
                    placeholder="Jean"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Nom *</label>
                  <input
                    type="text"
                    required
                    value={formData.surname}
                    onChange={(e) => setFormData({ ...formData, surname: e.target.value })}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
                    placeholder="Dupont"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Email *</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
                  placeholder="jean.dupont@example.com"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Mot de passe {editingUser ? "(laisser vide pour ne pas changer)" : "*"}
                </label>
                <input
                  type="password"
                  required={!editingUser}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
                  placeholder={editingUser ? "••••••••" : "Au moins 6 caractères"}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Rôle</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
                  >
                    <option value="user">Utilisateur</option>
                    <option value="student">Étudiant</option>
                    <option value="teacher">Enseignant</option>
                    <option value="admin">Administrateur</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Quota de Tokens (Autorisation) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="500"
                    required
                    value={formData.tokenQuota}
                    onChange={(e) => setFormData({ ...formData, tokenQuota: Number(e.target.value) })}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Preset buttons for token quota */}
              <div>
                <span className="text-[11px] text-slate-400 block mb-1">Préréglages de quota :</span>
                <div className="flex flex-wrap gap-2">
                  {[5000, 10000, 25000, 50000, 100000].map((preset) => (
                    <button
                      type="button"
                      key={preset}
                      onClick={() => setFormData({ ...formData, tokenQuota: preset })}
                      className={`rounded px-2.5 py-1 text-xs font-mono transition ${
                        formData.tokenQuota === preset
                          ? "bg-indigo-600 text-white font-bold"
                          : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                      }`}
                    >
                      {preset.toLocaleString()}
                    </button>
                  ))}
                </div>
              </div>

              {editingUser && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Tokens déjà consommés (ajuster ou réinitialiser)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      value={formData.tokensUsed}
                      onChange={(e) => setFormData({ ...formData, tokensUsed: Number(e.target.value) })}
                      className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, tokensUsed: 0 })}
                      className="whitespace-nowrap rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-slate-300 hover:bg-slate-700"
                    >
                      Réinitialiser à 0
                    </button>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 border-t border-slate-800 pt-4 mt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-sm text-slate-300 hover:bg-slate-700"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 px-5 py-2 text-sm font-semibold text-white hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50"
                >
                  {saving ? "Enregistrement..." : editingUser ? "Enregistrer les modifications" : "Créer l'utilisateur"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
