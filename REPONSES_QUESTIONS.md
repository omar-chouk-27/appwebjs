# Réponses aux questions du TP - Authentification Full Stack

## Partie 1 : Prisma et SQLite

### Q1 : Pourquoi l'attribut `@unique` sur `email` est-il indispensable ?
L'attribut `@unique` garantit au niveau du moteur de base de données (index unique) qu'un email correspond à un seul et unique compte utilisateur. Cela est indispensable pour pouvoir retrouver l'utilisateur de manière univoque lors de la phase de connexion. De plus, cela protège l'intégrité des données contre les conditions de concurrence (race conditions) lorsque deux requêtes d'inscription simultanées tentent d'enregistrer le même email (renvoyant l'erreur Prisma P2002).

### Q2 : Que contient le dossier `prisma/migrations` et pourquoi doit-il être versionné ?
Le dossier `prisma/migrations` contient l'historique chronologique des scripts SQL décrivant l'évolution de la structure de la base de données. Il doit impérativement être versionné dans Git pour permettre à l'équipe de développement, au serveur d'intégration continue (CI) et aux environnements de production de rejouer exactement le même schéma de données via `prisma migrate deploy`.

### Q3 : Quelle limite de SQLite faut-il connaître avant la production avec plusieurs serveurs ?
SQLite est une base de données fichier locale conçue avec un seul écrivain concurrent à la fois (verrouillage de fichier). Il ne permet pas le partage de données entre plusieurs serveurs ou instances de conteneurs éphémères (Docker, serverless, cloud horizontal). Pour un déploiement multi-instances, il est nécessaire de migrer vers un SGBD client-serveur tel que PostgreSQL ou MySQL en adaptant le provider et la configuration.

---

## Partie 2 : Validation et session

### Q1 : Quel est l'intérêt des options `httpOnly`, `secure` et `sameSite` ?
- **`httpOnly: true`** : Empêche tout script JavaScript côté client (`document.cookie`) d'accéder au cookie de session, ce qui protège efficacement contre le vol de session en cas d'attaque XSS (Cross-Site Scripting).
- **`secure: true`** : Garantit que le cookie n'est transmis par le navigateur que sur des connexions chiffrées HTTPS (évite l'interception sur le réseau).
- **`sameSite: "lax"`** : Empêche l'envoi du cookie lors des requêtes cross-site transverses (notamment les formulaires POST tiers), ce qui atténue fortement les attaques CSRF (Cross-Site Request Forgery).

### Q2 : Pourquoi ne jamais mettre le mot de passe (même haché) dans le payload du JWT ?
Le payload d'un JSON Web Token n'est pas chiffré, il est simplement encodé en Base64Url : n'importe qui en possession du token peut décoder et lire son contenu en clair. La signature cryptographique garantit uniquement l'intégrité et l'authenticité du jeton, et non sa confidentialité. De plus, exposer un hash facilite les attaques par force brute ou dictionnaires hors-ligne (tables arc-en-ciel). Le payload ne doit contenir que l'identifiant strict (ex: `userId`).

### Q3 : Que se passe-t-il si `JWT_SECRET` est modifié alors que des utilisateurs sont connectés ?
Tous les jetons JWT émis précédemment avec l'ancienne clé secrète échoueront à la vérification cryptographique (`jwtVerify` rejettera la signature). Tous les utilisateurs connectés se retrouveront instantanément déconnectés et redirigés vers `/login`. C'est une méthode radicale pour invalider globalement l'ensemble des sessions actives.

---

## Partie 3 : API d'authentification

### Q1 : Pourquoi renvoyer le même message pour un email inconnu et un mauvais mot de passe ?
Pour éviter l'énumération des utilisateurs (User Enumeration Attack). Si l'API renvoyait « Email inexistant » d'un côté et « Mot de passe erroné » de l'autre, un attaquant pourrait tester une liste d'adresses pour découvrir celles qui possèdent un compte sur le service. En répondant systématiquement « Identifiants invalides » avec le code 401, on protège la vie privée des utilisateurs.

### Q2 : Que signifie le paramètre 10 dans `bcrypt.hash` ? Quel effet a son augmentation ?
Le paramètre 10 correspond au **facteur de coût (salt rounds)**, soit $2^{10} = 1024$ tours de calcul. Chaque incrément de 1 double le temps processeur requis pour calculer ou vérifier le hash. Une valeur plus élevée renforce considérablement la résistance face aux attaques par force brute en cas de fuite de la base de données, mais augmente également le temps de réponse et la charge CPU du serveur lors des connexions légitimes (10 à 12 représente un compromis standard recommandé).

### Q3 : Quels codes HTTP utilise-t-on (201, 400, 401, 404, 409) et quand ?
- **`201 Created`** : Lorsque la création d'un nouvel utilisateur réussit (`POST /api/auth/register`).
- **`400 Bad Request`** : Lorsque la requête contient des données invalides (échec de validation Zod ou JSON malformé).
- **`401 Unauthorized`** : Lorsque l'utilisateur n'est pas authentifié ou fournit des identifiants invalides (mauvais mot de passe ou email inconnu).
- **`404 Not Found`** : Lorsque la ressource demandée n'existe pas (ex: utilisateur correspondant à la session introuvable en base sur `/api/auth/me`).
- **`409 Conflict`** : Lors d'un conflit d'unicité, notamment quand l'email fourni est déjà associé à un compte existant.

---

## Partie 4 : Protection des routes et Middleware

### Q1 : Pourquoi ne peut-on pas utiliser Prisma directement dans le middleware ?
Sous Next.js, le middleware s'exécute dans l'environnement léger **Edge Runtime**. Cet environnement restreint ne dispose pas de toutes les API Node.js requises par les moteurs natifs ou certains pilotes C/C++ (notamment les dépendances binaires comme SQLite). C'est pourquoi le middleware se contente de vérifier la validité cryptographique du JWT avec la bibliothèque légère `jose`, sans interroger directement la base de données.

### Q2 : Qu'est-ce que la défense en profondeur ? Pourquoi ne pas se fier au seul middleware ?
La défense en profondeur consiste à empiler plusieurs mécanismes de sécurité indépendants. Le middleware assure un premier filtre rapide au niveau du routage, mais il peut être mal configuré (mauvais pattern de matcher) ou contourné en cas d'erreur de proxy. Par conséquent, chaque page privée (Server Component) et chaque route d'API protégée revérifie explicitement la session et charge les données directement au niveau du serveur, au plus près de la ressource.
