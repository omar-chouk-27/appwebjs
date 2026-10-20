import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().trim().min(2, "Nom : 2 caractères minimum"),
  email: z.string().trim().toLowerCase().email("Email invalide"),
  password: z.string().min(8, "Mot de passe : 8 caractères minimum"),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Email invalide"),
  password: z.string().min(1, "Mot de passe requis"),
});

// Schémas pour la gestion des étudiants (TP2)
export const createStudentSchema = z.object({
  name: z.string().trim().min(2, "Nom : 2 caractères minimum"),
  email: z.string().trim().toLowerCase().email("Email invalide"),
  password: z.string().min(8, "Mot de passe : 8 caractères minimum"),
  role: z.enum(["ADMIN", "ENSEIGNANT", "ETUDIANT"]).optional().default("ETUDIANT"),
  filiere: z.string().trim().min(1, "Filière requise").optional().nullable(),
  notes: z.string().trim().optional().nullable(),
});

// Schéma pour modification par ADMIN (peut tout modifier sauf password ici)
export const adminUpdateStudentSchema = z.object({
  name: z.string().trim().min(2, "Nom : 2 caractères minimum").optional(),
  email: z.string().trim().toLowerCase().email("Email invalide").optional(),
  role: z.enum(["ADMIN", "ENSEIGNANT", "ETUDIANT"]).optional(),
  filiere: z.string().trim().optional().nullable(),
  notes: z.string().trim().optional().nullable(),
});

// Schéma pour modification par ENSEIGNANT (modifications pédagogiques uniquement)
export const teacherUpdateStudentSchema = z.object({
  filiere: z.string().trim().optional().nullable(),
  notes: z.string().trim().optional().nullable(),
});
