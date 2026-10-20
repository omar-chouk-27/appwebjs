"use client";

import { useEffect, useState } from "react";

export interface Student {
  id: number;
  name: string;
  email: string;
  role: string;
  filiere?: string | null;
  notes?: string | null;
  createdAt: string;
}

interface StudentManagerProps {
  currentUserRole: "ADMIN" | "ENSEIGNANT" | "ETUDIANT";
  currentUserId: number;
}

export default function StudentManager({
  currentUserRole,
  currentUserId,
}: StudentManagerProps) {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // État formulaire création (ADMIN)
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "ETUDIANT",
    filiere: "",
    notes: "",
  });

  // État formulaire édition (ADMIN ou ENSEIGNANT)
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [editForm, setEditForm] = useState<{
    name?: string;
    email?: string;
    role?: string;
    filiere?: string;
    notes?: string;
  }>({});

  async function fetchStudents() {
    try {
      setLoading(true);
      setError("");
      const res = await fetch("/api/students");
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(`Erreur ${res.status} : ${data.error || "Impossible de charger les étudiants"}`);
        return;
      }
      const data = await res.json();
      setStudents(data);
    } catch {
      setError("Erreur réseau lors de la récupération des étudiants");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchStudents();
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(createForm),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(`Erreur ${res.status} : ${data.error || "Échec de création"}`);
        return;
      }

      setSuccess("Étudiant créé avec succès !");
      setShowCreateModal(false);
      setCreateForm({
        name: "",
        email: "",
        password: "",
        role: "ETUDIANT",
        filiere: "",
        notes: "",
      });
      fetchStudents();
    } catch {
      setError("Erreur réseau lors de la création.");
    }
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!editingStudent) return;
    setError("");
    setSuccess("");

    try {
      const res = await fetch(`/api/students/${editingStudent.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(`Erreur ${res.status} : ${data.error || "Échec de modification"}`);
        return;
      }

      setSuccess("Informations mises à jour avec succès !");
      setEditingStudent(null);
      fetchStudents();
    } catch {
      setError("Erreur réseau lors de la mise à jour.");
    }
  }

  async function handleDelete(id: number, name: string) {
    if (!confirm(`Confirmez-vous la suppression définitive de ${name} ?`)) return;
    setError("");
    setSuccess("");

    try {
      const res = await fetch(`/api/students/${id}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (!res.ok) {
        setError(`Erreur ${res.status} : ${data.error || "Échec de suppression"}`);
        return;
      }

      setSuccess("Étudiant supprimé avec succès !");
      fetchStudents();
    } catch {
      setError("Erreur réseau lors de la suppression.");
    }
  }

  function openEdit(student: Student) {
    setEditingStudent(student);
    if (currentUserRole === "ADMIN") {
      setEditForm({
        name: student.name,
        email: student.email,
        role: student.role,
        filiere: student.filiere || "",
        notes: student.notes || "",
      });
    } else {
      // ENSEIGNANT : champs pédagogiques seulement
      setEditForm({
        filiere: student.filiere || "",
        notes: student.notes || "",
      });
    }
  }

  return (
    <div className="space-y-6">
      {/* Alertes d'état */}
      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <p className="font-semibold">Alerte sécurité / Erreur :</p>
          <p>{error}</p>
        </div>
      )}
      {success && (
        <div className="rounded-md border border-green-200 bg-green-50 p-4 text-sm text-green-700">
          {success}
        </div>
      )}

      {/* Barre d'action supérieure */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">
            {currentUserRole === "ETUDIANT"
              ? "Mon Dossier Étudiant"
              : "Gestion des Étudiants"}
          </h2>
          <p className="text-sm text-slate-500">
            {currentUserRole === "ADMIN" &&
              "Accès complet : Création, consultation, modification et suppression."}
            {currentUserRole === "ENSEIGNANT" &&
              "Accès pédagogique : Consultation de la liste et mise à jour des notes/filière."}
            {currentUserRole === "ETUDIANT" &&
              "Accès restreint : Consultation stricte de vos données personnelles."}
          </p>
        </div>

        {currentUserRole === "ADMIN" && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="rounded bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-indigo-700"
          >
            + Nouvel Étudiant
          </button>
        )}
      </div>

      {/* Modal Création (ADMIN) */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl">
            <h3 className="mb-4 text-lg font-bold text-slate-800">
              Créer un nouvel utilisateur / étudiant
            </h3>
            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700">Nom complet</label>
                <input
                  required
                  type="text"
                  value={createForm.name}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                  className="w-full rounded border p-2 text-sm"
                  placeholder="Ex: Jean Dupont"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700">Email</label>
                <input
                  required
                  type="email"
                  value={createForm.email}
                  onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                  className="w-full rounded border p-2 text-sm"
                  placeholder="jean@ecole.fr"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700">Mot de passe temporaire</label>
                <input
                  required
                  type="password"
                  value={createForm.password}
                  onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                  className="w-full rounded border p-2 text-sm"
                  placeholder="Au moins 8 caractères"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700">Rôle</label>
                  <select
                    value={createForm.role}
                    onChange={(e) => setCreateForm({ ...createForm, role: e.target.value })}
                    className="w-full rounded border p-2 text-sm"
                  >
                    <option value="ETUDIANT">ETUDIANT</option>
                    <option value="ENSEIGNANT">ENSEIGNANT</option>
                    <option value="ADMIN">ADMIN</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700">Filière</label>
                  <input
                    type="text"
                    value={createForm.filiere}
                    onChange={(e) => setCreateForm({ ...createForm, filiere: e.target.value })}
                    className="w-full rounded border p-2 text-sm"
                    placeholder="Informatique, Droit..."
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700">Notes / Remarques</label>
                <textarea
                  value={createForm.notes}
                  onChange={(e) => setCreateForm({ ...createForm, notes: e.target.value })}
                  className="w-full rounded border p-2 text-sm"
                  placeholder="Commentaires pédagogiques..."
                  rows={2}
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="rounded border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="rounded bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Édition */}
      {editingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl">
            <h3 className="mb-2 text-lg font-bold text-slate-800">
              Modifier l'étudiant : {editingStudent.name}
            </h3>
            <p className="mb-4 text-xs text-slate-500">
              {currentUserRole === "ADMIN"
                ? "Modification administrative complète."
                : "Modification pédagogique autorisée (Filière et Notes)."}
            </p>
            <form onSubmit={handleUpdate} className="space-y-3">
              {currentUserRole === "ADMIN" && (
                <>
                  <div>
                    <label className="block text-xs font-medium text-slate-700">Nom</label>
                    <input
                      type="text"
                      value={editForm.name ?? ""}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      className="w-full rounded border p-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700">Email</label>
                    <input
                      type="email"
                      value={editForm.email ?? ""}
                      onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                      className="w-full rounded border p-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700">Rôle</label>
                    <select
                      value={editForm.role ?? "ETUDIANT"}
                      onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                      className="w-full rounded border p-2 text-sm"
                    >
                      <option value="ETUDIANT">ETUDIANT</option>
                      <option value="ENSEIGNANT">ENSEIGNANT</option>
                      <option value="ADMIN">ADMIN</option>
                    </select>
                  </div>
                </>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-700">Filière</label>
                <input
                  type="text"
                  value={editForm.filiere ?? ""}
                  onChange={(e) => setEditForm({ ...editForm, filiere: e.target.value })}
                  className="w-full rounded border p-2 text-sm"
                  placeholder="Filière d'études"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700">Notes / Informations pédagogiques</label>
                <textarea
                  value={editForm.notes ?? ""}
                  onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                  className="w-full rounded border p-2 text-sm"
                  rows={3}
                  placeholder="Appréciations ou notes d'examen..."
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingStudent(null)}
                  className="rounded border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="rounded bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
                >
                  Sauvegarder
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tableau des étudiants */}
      {loading ? (
        <div className="p-8 text-center text-slate-500">Chargement des données...</div>
      ) : students.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-300 p-8 text-center text-slate-500">
          Aucun étudiant trouvé.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">Nom</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Rôle</th>
                <th className="px-4 py-3">Filière</th>
                <th className="px-4 py-3">Notes & Remarques</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {students.map((st) => (
                <tr key={st.id} className={st.id === currentUserId ? "bg-indigo-50/50" : ""}>
                  <td className="px-4 py-3 font-mono text-xs text-slate-500">{st.id}</td>
                  <td className="px-4 py-3 font-medium text-slate-900">
                    {st.name} {st.id === currentUserId && <span className="text-xs text-indigo-600 font-bold">(Vous)</span>}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{st.email}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        st.role === "ADMIN"
                          ? "bg-purple-100 text-purple-800"
                          : st.role === "ENSEIGNANT"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-emerald-100 text-emerald-800"
                      }`}
                    >
                      {st.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-700">{st.filiere || "—"}</td>
                  <td className="px-4 py-3 text-slate-600 max-w-xs truncate" title={st.notes || ""}>
                    {st.notes || "—"}
                  </td>
                  <td className="px-4 py-3 text-right space-x-2">
                    {/* ENSEIGNANT ou ADMIN peuvent modifier */}
                    {(currentUserRole === "ADMIN" || currentUserRole === "ENSEIGNANT") && (
                      <button
                        onClick={() => openEdit(st)}
                        className="text-xs font-semibold text-indigo-600 hover:text-indigo-900"
                      >
                        Modifier
                      </button>
                    )}

                    {/* Seul ADMIN peut supprimer */}
                    {currentUserRole === "ADMIN" && (
                      <button
                        onClick={() => handleDelete(st.id, st.name)}
                        className="text-xs font-semibold text-red-600 hover:text-red-900"
                      >
                        Supprimer
                      </button>
                    )}

                    {currentUserRole === "ETUDIANT" && (
                      <span className="text-xs text-slate-400">Lecture seule</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
