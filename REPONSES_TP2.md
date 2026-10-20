# Réponses aux questions de réflexion — TP2 : Gestion des rôles et contrôle d’accès

---

### 1. Quelle différence entre authentification et autorisation ?
* **Authentification (AuthN — *Qui êtes-vous ?*)** : C'est le processus permettant de vérifier et prouver l'identité d'un utilisateur (par exemple via son email et mot de passe, ou la validation cryptographique d'un jeton JWT signé). L'authentification répond par : « Vous êtes bien Alice (identifiant 3) ».
* **Autorisation (AuthZ — *Qu'avez-vous le droit de faire ?*)** : C'est l'ensemble des règles déterminant si l'utilisateur authentifié possède les droits et privilèges requis pour exécuter une action spécifique ou accéder à une ressource donnée (ex: un utilisateur avec le rôle `ADMIN` peut supprimer un compte, alors qu'un `ETUDIANT` ne peut que consulter ses propres notes).

---

### 2. Quelle différence entre HTTP 401 et 403 ?
* **HTTP 401 Unauthorized** : Signifie en réalité *« Non authentifié »*. Le client ne s'est pas identifié ou le jeton de session est absent, invalide ou expiré. Une authentification valide est requise pour retenter la requête.
* **HTTP 403 Forbidden** : Signifie *« Interdit / Accès refusé »*. L'utilisateur est parfaitement authentifié et son identité est reconnue par le serveur, mais il ne possède pas les permissions ou le rôle suffisant pour cette action. Contrairement au code 401, renvoyer les mêmes identifiants ne changera rien.

---

### 3. Pourquoi masquer un bouton ne suffit-il pas ?
Masquer ou désactiver un bouton dans le navigateur (React, DOM client) n'est qu'une commodité ergonomique (**UX**). Le client reste sous le contrôle exclusif de l'utilisateur ou d'un attaquant :
* N'importe qui peut ouvrir les outils de développement (DevTools), réactiver un bouton masqué, ou envoyer directement la requête HTTP via un terminal (`curl`, Postman, script Python/JS).
* Si l'API côté serveur ne vérifie pas le rôle de l'expéditeur, l'action sera exécutée sans entrave. **La sécurité doit impérativement être appliquée et garantie côté serveur.**

---

### 4. Qu’est-ce qu’une vulnérabilité IDOR (Insecure Direct Object Reference) ?
Une vulnérabilité **IDOR** survient lorsqu'une application permet à un utilisateur d'accéder directement à un objet métier (un dossier, une note, un fichier) simplement en modifiant sa référence ou son identifiant dans la requête (par exemple en changeant `/api/students/12` en `/api/students/13`), sans que le serveur ne vérifie si l'utilisateur connecté est le propriétaire légitime ou détient le droit d'accès sur cet objet.
* *Protection implémentée dans notre TP* : Dans `/api/students/[id]`, si l'utilisateur possède le rôle `ETUDIANT`, le serveur vérifie que `session.userId === targetId`. Toute tentative d'accès à la fiche d'un autre étudiant est bloquée avec une erreur **403 Forbidden**.

---

### 5. Pourquoi ne pas accepter le rôle envoyé par le client ?
Le client (navigateur, mobile) est un environnement **non fiable** (Untrusted Environment). Si le serveur se fiait à un champ `{ "role": "ADMIN" }` transmis dans le corps JSON ou les en-têtes d'une requête HTTP, un utilisateur lambda ou malveillant pourrait facilement modifier sa charge utile pour s'octroyer des privilèges administrateur (usurpation de privilèges).
* Le rôle doit toujours être :
  1. Soit scellé dans un **JWT cryptographiquement signé** avec un secret serveur inviolable.
  2. Soit, idéalement (comme nous l'avons fait dans `requireRole`), **relu directement en base de données** à partir de l'identifiant extrait de la session vérifiée (défense en profondeur).
