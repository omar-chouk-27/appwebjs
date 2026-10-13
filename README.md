# TP Authentification Full Stack

Application d'authentification construite avec Next.js, Prisma et SQLite.

## Démarrage

```bash
npm install
npx prisma migrate dev
npm run dev
```

Ouvrir ensuite [http://localhost:3000](http://localhost:3000).

## Fonctionnalités

- Inscription et connexion avec validation serveur
- Session JWT stockée dans un cookie HttpOnly
- Tableau de bord protégé
- Déconnexion côté serveur

## Routes utiles

- `/` page d'accueil
- `/login` connexion
- `/register` inscription
- `/dashboard` tableau de bord protégé
