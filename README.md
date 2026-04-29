# BookNook

Une application web permettant aux utilisateurs de découvrir, organiser et suivre leur collection de livres. Chaque utilisateur peut gérer sa bibliothèque personnelle, marquer ses favoris, suivre sa progression de lecture et recevoir des recommandations personnalisées.

---

## Fonctionnalités

- **Authentification** — connexion via Google OAuth ou compte local (email / mot de passe)
- **Exploration** — parcourir des livres via l'API OpenLibrary
- **Bibliothèque personnelle** — ajouter des livres avec un statut : `favori`, `en cours`, `terminé`, `wishlist`
- **Recommandations** — suggestions basées sur les livres favoris et terminés de l'utilisateur
- **Tendances** — carrousel de livres populaires sur la page d'accueil
- **Profil** — statistiques de lecture (nombre de livres par statut, date d'inscription, dernier livre ajouté)

---

## Stack technique

| Catégorie | Technologie |
|---|---|
| Runtime | Node.js |
| Framework | Express 5 |
| Templates | EJS |
| Base de données | SQLite3 |
| Auth | Google OAuth 2.0 · bcryptjs |
| Sessions | express-session |
| API externe | OpenLibrary API |
| Frontend | HTML · CSS · JavaScript vanilla |

---

## Prérequis

- [Node.js](https://nodejs.org/) v18 ou supérieur
- Un compte Google Cloud avec un projet OAuth configuré

---

## Installation

**1. Cloner le dépôt**

```bash
git clone <url-du-repo>
cd Book-note
```

**2. Installer les dépendances**

```bash
npm install
```

**3. Configurer les variables d'environnement**

Créer un fichier `.env` à la racine du projet :

```env
GOOGLE_CLIENT_ID=<votre_google_client_id>
SESSION_SECRET=<une_chaine_aleatoire_secrete>
```

> Pour obtenir un `GOOGLE_CLIENT_ID`, créer un projet sur [Google Cloud Console](https://console.cloud.google.com/), activer l'API Google Identity, puis créer des identifiants OAuth 2.0 de type "Application Web". Ajouter `http://localhost:3000` aux origines JavaScript autorisées.

**4. Lancer l'application**

```bash
npm start
```

L'application est accessible sur [http://localhost:3000](http://localhost:3000).

> La base de données SQLite (`database.db`) et les tables sont créées automatiquement au premier lancement.

---

## Arborescence

```
Book-note/
├── app.js                    # Point d'entrée — Express, sessions, routes
├── config/
│   ├── db.js                 # Connexion SQLite
│   ├── initDb.js             # Chargement des tables au démarrage
│   └── tables/
│       ├── users.js          # Table users
│       ├── auth_providers.js # Table auth_providers (local / google)
│       └── library_status.js # Table library_status (statuts des livres)
├── routes/
│   ├── index.js              # / — accueil, auth Google, auth locale
│   ├── library.js            # /library — exploration de livres
│   ├── books.js              # /books/:type/:id — détail d'un livre + statuts
│   ├── list.js               # /list — bibliothèque personnelle de l'utilisateur
│   └── profil.js             # /profil — statistiques utilisateur
├── views/
│   ├── pages/
│   │   ├── index.ejs         # Page d'accueil
│   │   ├── library.ejs       # Page bibliothèque
│   │   ├── books.ejs         # Page détail livre
│   │   ├── list.ejs          # Page ma liste
│   │   └── profil.ejs        # Page profil
│   └── partials/
│       ├── head.ejs          # Balises <head>
│       ├── header.ejs        # Navigation
│       └── footer.ejs        # Pied de page
├── public/
│   ├── css/style.css
│   ├── js/
│   │   ├── auth.js           # Gestion de l'authentification côté client
│   │   ├── books.js          # Interactions page livre
│   │   ├── carousel.js       # Carrousel de livres
│   │   ├── google.js         # Intégration Google Sign-In
│   │   └── list.js           # Interactions page liste
│   └── picture/
├── .env                      # Variables d'environnement (non versionné)
├── .gitignore
├── package.json
└── database.db               # Base SQLite (générée automatiquement)
```

---

## Schéma de base de données

```
users
├── id            INTEGER PK AUTOINCREMENT
├── email         VARCHAR(255) UNIQUE NOT NULL
├── username      VARCHAR(100)
├── local         VARCHAR(50)
└── created_at    DATETIME

auth_providers
├── id            INTEGER PK AUTOINCREMENT
├── user_id       INTEGER FK → users.id
├── provider      VARCHAR(50)   -- "local" | "google"
├── password_hash VARCHAR(255)  -- null si Google
├── provider_id   VARCHAR(255)  -- null si local
└── created_at    DATETIME

library_status
├── user_id       INTEGER FK → users.id  ┐
├── api_book_id   VARCHAR(100)           ┘ PK composite
├── status        VARCHAR(50)   -- "favorite" | "reading" | "completed" | "wishlist"
├── created_at    DATETIME
└── updated_at    DATETIME
```

---

## Routes API

| Méthode | Route | Description |
|---|---|---|
| GET | `/` | Page d'accueil |
| POST | `/auth/google` | Connexion via Google OAuth |
| POST | `/auth/register` | Inscription locale |
| POST | `/auth/login` | Connexion locale |
| GET | `/logout` | Déconnexion |
| GET | `/library` | Exploration de livres |
| GET | `/books/:type/:id` | Détail d'un livre |
| POST | `/books/status` | Ajouter / modifier le statut d'un livre |
| POST | `/books/status/delete` | Supprimer un livre de la collection |
| GET | `/list` | Bibliothèque personnelle *(authentifié)* |
| GET | `/profil` | Profil et statistiques *(authentifié)* |

---

## Équipe

Projet réalisé dans le cadre de **Yboost 2025/2026**.

| Membre | |
|---|---|
| Victoria | |
| Hugo | |
| Mathéo | |
| Teddy | 

**Trello** — https://trello.com/b/YFQMKOXn/yboost-booktock  
**Roadmap Figma** — https://www.figma.com/board/e2WZnF9tmXjdSQ5vd765ko/road-map-book
