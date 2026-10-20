import Database from "better-sqlite3";
import bcrypt from "bcryptjs";
import path from "path";

async function seed() {
  const db = new Database(path.resolve(process.cwd(), "dev.db"));

  const hash = await bcrypt.hash("password123", 10);

  // Vérifier et insérer les 3 comptes de test fondamentaux du TP2
  const users = [
    {
      name: "Admin Principal",
      email: "admin@ecole.fr",
      password: hash,
      role: "ADMIN",
      filiere: null,
      notes: null,
    },
    {
      name: "Professeur Martin",
      email: "prof@ecole.fr",
      password: hash,
      role: "ENSEIGNANT",
      filiere: "Informatique",
      notes: "Enseignant référent Next.js & Bases de données",
    },
    {
      name: "Etudiant Alice",
      email: "alice@ecole.fr",
      password: hash,
      role: "ETUDIANT",
      filiere: "Génie Logiciel",
      notes: "Note TP1: 18/20",
    },
    {
      name: "Etudiant Bob",
      email: "bob@ecole.fr",
      password: hash,
      role: "ETUDIANT",
      filiere: "Systèmes & Réseaux",
      notes: "Note TP1: 15/20",
    },
  ];

  for (const u of users) {
    const existing = db.prepare("SELECT id FROM User WHERE email = ?").get(u.email);
    if (!existing) {
      db.prepare(
        "INSERT INTO User (name, email, password, role, filiere, notes) VALUES (?, ?, ?, ?, ?, ?)"
      ).run(u.name, u.email, u.password, u.role, u.filiere, u.notes);
      console.log(`Utilisateur créé : ${u.name} (${u.role}) - ${u.email}`);
    } else {
      console.log(`Utilisateur existant : ${u.name} (${u.role})`);
    }
  }

  db.close();
}

seed().catch(console.error);
