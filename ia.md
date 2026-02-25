# 📚 BOOK NOTE - Architecture & Documentation Technique

**Version:** 1.0.0 | **Projet:** Yboost 2025-2026 | **Équipe:** Victoria, Hugo, Mathéo, Teddy

---

## 📋 Table des Matières
1. [Vue d'ensemble](#vue-densemble)
2. [Architecture générale](#architecture-générale)
3. [Stack technologique](#stack-technologique)
4. [Structure du projet](#structure-du-projet)
5. [Base de données](#base-de-données)
6. [Routes & Flux](#routes--flux)
7. [Authentification](#authentification)
8. [Gestion des sessions](#gestion-des-sessions)
9. [Fichiers clés](#fichiers-clés)
10. [Flux utilisateur](#flux-utilisateur)
11. [APIs externes](#apis-externes)

---

## 🎯 Vue d'ensemble

**Book Note** est une plateforme web permettant aux utilisateurs de:
- 📖 Gérer leur collection personnelle de livres
- ❤️ Marquer des livres comme favoris
- 📋 Créer une liste de souhaits
- 📊 Analyser leurs statistiques (genres, auteurs préférés)
- 🔒 S'authentifier via Google OAuth 2.0

**Objectif:** Offrir une plateforme intuitive et centralizada pour l'organisation et l'exploration de sa librairie personnelle.

---

## 🏗️ Architecture générale

```
┌─────────────────────────────────────────────────────────┐
│                    NAVIGATEUR CLIENT                     │
│  (HTML/EJS + Public/CSS + Public/JS/auth.js)           │
└──────────────────┬──────────────────────────────────────┘
                   │ HTTP Requests
                   ▼
┌─────────────────────────────────────────────────────────┐
│         EXPRESS.JS SERVER (app.js)                      │
│  - Session Management (express-session)                 │
│  - Body Parsing (express, body-parser)                  │
│  - Routing (routes/)                                    │
└────┬──┬──┬───────────────────────────────────────────────┘
     │  │  │
     │  │  ├─ Routes: index.js (Auth/Logout)
     │  │  ├─ Routes: books.js (Détails livres)
     │  │  ├─ Routes: library.js (Recherche livres)
     │  │  └─ Routes: profil.js (Profil utilisateur)
     │  │
     │  └─ Session Storage (express-session)
     │
     ▼
┌─────────────────────────────────────────────────────────┐
│     SQLITE3 DATABASE (database.db)                      │
│  - TABLE: users                                         │
│  - TABLE: auth_providers                                │
│  - TABLE: library_status                                │
└─────────────────────────────────────────────────────────┘
     ▲
     │ Requêtes externes
     │
     ├─ Google OAuth 2.0 (Authentification)
     ├─ OpenLibrary API (Données livres)
     └─ Google Covers API (Images de couverture)
```

---

## 💻 Stack technologique

| Couche | Technologies |
|--------|--------------|
| **Backend** | Node.js, Express.js v5.1.0 |
| **Frontend** | EJS (Template Engine), HTML5, CSS3, Vanilla JavaScript |
| **Base de données** | SQLite3 v5.1.7 |
| **Authentification** | Google OAuth 2.0, google-auth-library v10.5.0 |
| **Middleware** | express-session v1.18.2, body-parser v2.2.0 |
| **Requêtes externes** | Fetch API (pour OpenLibrary) |

### Dependencies du projet
```json
{
  "body-parser": "^2.2.0",        // Parsing des données POST/PUT
  "ejs": "^3.1.10",               // Template rendering
  "express": "^5.1.0",            // Framework web
  "express-session": "^1.18.2",   // Gestion des sessions utilisateur
  "fetch": "^1.1.0",              // HTTP requests
  "google-auth-library": "^10.5.0", // Vérification tokens Google
  "sqlite3": "^5.1.7"             // Base de données SQLite
}
```

---

## 📁 Structure du projet

```
Book-note/
├── app.js                          # Point d'entrée principal
├── package.json                    # Configuration npm
├── README.md                        # Documentation utilisateur
├── ia.md                          # Cette documentation (pour IA)
│
├── config/                         # Configuration système
│   ├── db.js                      # Connexion SQLite
│   ├── initDb.js                  # Initialisation tables
│   └── tables/
│       ├── users.js               # Création table users
│       ├── auth_providers.js       # Création table auth_providers
│       └── library_status.js       # Création table library_status
│
├── routes/                         # Gestion des endpoints
│   ├── index.js                   # Auth (GET /, POST /auth/google, GET /logout)
│   ├── books.js                   # Détails/Status livres
│   ├── library.js                 # Recherche et affichage livres
│   └── profil.js                  # Page profil utilisateur
│
├── views/                          # Templates EJS
│   ├── pages/
│   │   ├── index.ejs              # Page d'accueil
│   │   ├── books.ejs              # Détails d'un livre
│   │   ├── library.ejs            # Bibliothèque de recherche
│   │   └── profil.ejs             # Page profil
│   └── partials/
│       ├── header.ejs             # Header (navbar) partagée
│       ├── footer.ejs             # Footer partagée
│       └── head.ejs               # Head partagée
│
└── public/                         # Fichiers statiques
    ├── js/
    │   ├── auth.js                # Gestion Google Sign-In
    │   ├── books.js               # Interactions livres (client)
    │   └── google.js              # Configuration Google
    ├── css/
    │   └── style.css              # Feuille de styles
    └── images/
        └── ...                    # Ressources statiques
```

---

## 🗄️ Base de données

### 1️⃣ Table: `users`
**Objectif:** Stocker les informations utilisateur
```sql
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,      -- ID unique
  email VARCHAR(255) NOT NULL UNIQUE,        -- Email (unique)
  username VARCHAR(100),                     -- Nom d'affichage
  local VARCHAR(50),                         -- Localisation (locale lingua)
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP  -- Date création
)
```
**Clé primaire:** `id`  
**Index unique:** `email`  
**Cas d'usage:** Créé lors du première connexion Google

### 2️⃣ Table: `auth_providers`
**Objectif:** Gérer les providers d'authentification (Google, local, etc.)
```sql
CREATE TABLE IF NOT EXISTS auth_providers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,      -- ID unique
  user_id INTEGER NOT NULL,                  -- Référence à l'utilisateur
  provider VARCHAR(50) NOT NULL,             -- 'google' | 'local'
  password_hash VARCHAR(255),                -- Hash mot de passe (si local)
  provider_id VARCHAR(255),                  -- ID du provider externe
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
)
```
**Clé étrangère:** `user_id` → `users.id`  
**Cas d'usage:** Connexion future via Google ou authentification locale

### 3️⃣ Table: `library_status`
**Objectif:** Associer les livres aux utilisateurs avec un statut
```sql
CREATE TABLE IF NOT EXISTS library_status (
  user_id INTEGER NOT NULL,                  -- ID utilisateur
  api_book_id VARCHAR(100) NOT NULL,         -- ID livre (OpenLibrary)
  status VARCHAR(50) NOT NULL,               -- 'wishlist' | 'reading' | 'completed' | 'favorite'
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, api_book_id),        -- Clé composite (1 ligne par user/livre)
  FOREIGN KEY (user_id) REFERENCES users(id),
  UNIQUE(user_id, api_book_id)
)
```
**Clé composite:** `(user_id, api_book_id)`  
**Cas d'usage:** Un utilisateur peut avoir un seul statut par livre

---

## 🔄 Routes & Flux

### 📍 Route INDEX (index.js)
```
GET /
└─ Affiche la page d'accueil (index.ejs)

POST /auth/google
├─ Reçoit le token JWT de Google
├─ Vérifie avec google-auth-library
├─ Crée/Met à jour l'utilisateur en BD
├─ Enregistre en session
└─ Retourne JSON: { success: true, user: {...} }

GET /logout
├─ Détruit la session
└─ Redirige vers "/"
```

### 📚 Route LIBRARY (library.js)
```
GET /library
├─ Cherche les livres sur OpenLibrary API
│  └─ Requête par défaut: "?q=programming"
├─ Retourne max 20 résultats
├─ Rend la page library.ejs avec les livres
└─ Gère les erreurs API
```

### 📖 Route BOOKS (books.js)
```
GET /books/:type/:id
├─ :type = 'works' ou 'editions'
├─ :id = ID du livre sur OpenLibrary
├─ Récupère détails du livre
├─ Récupère couverture (si disponible)
├─ Récupère tous les auteurs (requêtes parallèles)
├─ Rend page books.ejs
└─ Retourne: { book, coverUrl, authors, user, clientId }

POST /books/status
├─ Reçoit: { user_id, api_book_id, status }
├─ Crée ou met à jour le statut en BD
│  └─ INSERT ... ON CONFLICT(user_id, api_book_id) DO UPDATE ...
├─ Status possibles: 'wishlist', 'reading', 'completed', 'favorite'
└─ Retourne JSON: { message: "Statut enregistré" }
```

### 👤 Route PROFIL (profil.js)
```
GET /profil
├─ Vérifie que l'utilisateur est connecté
│  └─ Si non: redirige vers "/"
├─ Rend la page profil.ejs
└─ Passe user + clientId au template
```

---

## 🔐 Authentification

### Flux Google OAuth 2.0

```
┌────────────────────────────────────────────────────────────┐
│ 1️⃣ CLIENT CLIQUE SUR BOUTON "SIGN IN WITH GOOGLE"        │
│    (header.ejs avec Google Sign-In button)                 │
└─────────────────────┬──────────────────────────────────────┘
                      │
┌─────────────────────▼──────────────────────────────────────┐
│ 2️⃣ GOOGLE RETOURNE UN JWT TOKEN                          │
│    handleCredentialResponse() capte la réponse            │
│    (public/js/auth.js)                                     │
└─────────────────────┬──────────────────────────────────────┘
                      │
┌─────────────────────▼──────────────────────────────────────┐
│ 3️⃣ ENVOI POST /auth/google AVEC LE TOKEN                 │
│    fetch('/auth/google', {                                 │
│      body: JSON.stringify({ credential: response })       │
│    })                                                      │
└─────────────────────┬──────────────────────────────────────┘
                      │
┌─────────────────────▼──────────────────────────────────────┐
│ 4️⃣ SERVER VÉRIFIE LE TOKEN (routes/index.js)             │
│    client.verifyIdToken({                                 │
│      idToken: credential,                                 │
│      audience: CLIENT_ID                                  │
│    })                                                      │
└─────────────────────┬──────────────────────────────────────┘
                      │
              ┌───────┴────────┐
              │ Si valide ✅   │ Si invalide ❌
              ▼                ▼
    ┌──────────────────┐  ┌──────────────────┐
    │ Crée/Maj user BD │  │ Retourne erreur  │
    │ Enregistre session   │ 400 Bad Request   │
    │ Reload page      │  │                  │
    └──────────────────┘  └──────────────────┘
```

### Données extraites du token Google
```javascript
{
  sub: "Google User ID",              // ID unique Google
  name: "Prénom Nom",
  email: "utilisateur@gmail.com",
  picture: "https://lh3.googleusercontent.com/...",
  locale: "fr"
}
```

### CLIENT_ID (Authentification)
```
ID Google: 754068118410-8s00fbmh36hst5e1aclmkf7v2ucp6mnb.apps.googleusercontent.com
```

---

## 🔑 Gestion des sessions

### Configuration de session (app.js)
```javascript
app.use(session({
  secret: 'ton_secret_super_secure',        // Clé de chiffrement
  resave: false,                            // Pas de sauvegarde si pas modifiée
  saveUninitialized: false,                 // Pas de création si vide
  cookie: { maxAge: 24 * 60 * 60 * 1000 }  // Expire après 24h
}));
```

### Injection du user dans les templates
```javascript
app.use((req, res, next) => {
  res.locals.user = req.session.user || null;      // Utilisateur connecté (ou null)
  res.locals.clientId = CLIENT_ID;                 // ID pour Google Sign-In
  next();
});
```

### Vérification d'authentification
Dans `header.ejs`:
```ejs
<% if (!user) { %>
  <!-- Affiche bouton Google Sign-In -->
<% } else { %>
  <!-- Affiche infos utilisateur + avatar -->
<% } %>
```

---

## 📄 Fichiers clés

### 🚀 app.js - Point d'entrée
**Rôle:** Initialisation du serveur Express
- Charge la BD SQLite
- Configure les middlewares (body-parser, EJS, session)
- Enregistre les routes
- Injecte user/clientId dans res.locals
- Lance le serveur sur port 3000

**Principaux middlewares:**
```javascript
express.urlencoded({ extended: true })    // Parse form data
express.json()                             // Parse JSON
session(...)                               // Gestion sessions
express.static('public')                   // Fichiers statiques
```

### 🔌 config/db.js - Connexion SQLite
**Rôle:** Crée la connexion à la base de données
```javascript
const db = new sqlite3.Database('./database.db', callback);
module.exports = db;  // Exporté pour être réutilisé partout
```

### 📊 config/initDb.js - Initialisation tables
**Rôle:** Crée les tables à la première exécution
```javascript
require("./tables/users");           // Crée table users
require("./tables/auth_providers");  // Crée table auth_providers
require("./tables/library_status");  // Crée table library_status
```

### 🔐 routes/index.js - Authentification
**Endpoints:**
- `GET /` - Page d'accueil
- `POST /auth/google` - Authentification Google
- `GET /logout` - Déconnexion

**Logique clé:**
```javascript
// Vérification du token
const ticket = await client.verifyIdToken({ idToken, audience });
const payload = ticket.getPayload();  // Extr info utilisateur

// Insertion ou mise à jour en BD
db.run(`INSERT INTO users (...) VALUES (...) ON CONFLICT(email) DO UPDATE ...`);

// Enregistrement en session
req.session.user = { id, name, email, picture, locale };
```

### 📚 routes/library.js - Recherche des livres
**Endpoint:**
- `GET /library` - Liste des livres

**Logique:**
```javascript
const response = await fetch("https://openlibrary.org/search.json?q=programming");
const books = response.docs.slice(0);  // Résultats de recherche
res.render('pages/library', { books, user, clientId });
```

### 📖 routes/books.js - Détails d'un livre
**Endpoints:**
- `GET /books/:type/:id` - Détails d'un livre
- `POST /books/status` - Enregistre le statut utilisateur

**Logique GET:**
```javascript
// Récupère les données du livre
const response = await fetch(`https://openlibrary.org/${bookKey}.json`);
const bookData = response.json();

// Récupère la couverture
const coverUrl = `https://covers.openlibrary.org/b/id/${bookData.covers[0]}-L.jpg`;

// Récupère tous les auteurs (parallèle)
const authors = await Promise.all(
  bookData.authors.map(async (authorObj) => {
    const authorData = await fetch(`https://openlibrary.org${authorObj.author.key}.json`);
    return authorData.json().name;
  })
);

res.render('pages/books', { book: bookData, coverUrl, authors, user, clientId });
```

**Logique POST /status:**
```javascript
db.run(`
  INSERT INTO library_status (user_id, api_book_id, status)
  VALUES (?, ?, ?)
  ON CONFLICT(user_id, api_book_id)
  DO UPDATE SET status=excluded.status, updated_at=CURRENT_TIMESTAMP
`, [user_id, api_book_id, status]);
```

### 👤 routes/profil.js - Profil utilisateur
**Endpoint:**
- `GET /profil` - Page profil (authentification requise)

**Logique:**
```javascript
if (!req.session.user) {
  return res.redirect('/');  // Non authentifié → accueil
}
res.render('pages/profil', { user: req.session.user, clientId });
```

### 🎨 public/js/auth.js - Authentification côté client
**Rôle:** Gestion du bouton Google Sign-In
```javascript
// 1. Récupère le token de Google
function handleCredentialResponse(response) {
  const credential = response.credential;

  // 2. Envoie au serveur
  fetch('/auth/google', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ credential })
  })
  .then(res => res.json())
  .then(data => {
    if (data.success) {
      window.location.reload();  // Recharge la page
    }
  });
}

// 3. Initialise Google Sign-In au chargement
window.onload = function() {
  google.accounts.id.initialize({
    client_id: clientId,
    callback: handleCredentialResponse
  });
  google.accounts.id.renderButton(document.getElementById('buttonDiv'), ...);
};
```

### 🎨 views/partials/header.ejs - Navbar partagée
**Logique:**
```ejs
<% if (!user) { %>
  <!-- Non connecté: Affiche bouton Google -->
<% } else { %>
  <!-- Connecté: Affiche nom + avatar + lien profil -->
<% } %>
```

---

## 📱 Flux utilisateur

```
┌─────────────────────────────────────────────────────────┐
│ 1. ACCUEIL (GET /)                                      │
│    - Utilisateur atterrit sur la page d'accueil         │
│    - Nombre de fois: TOUJOURS (première visite)         │
└────────────────────┬────────────────────────────────────┘
                     │
        ┌────────────┴────────────┐
        │                         │
    ❌ PAS CONNECTÉ          ✅ CONNECTÉ
        │                         │
        ▼                         ▼
   ┌─────────────┐        ┌──────────────┐
   │ Voit header │        │ Voit header  │
   │ avec logo   │        │ avec profil  │
   │ et bouton   │        │ + avatar     │
   │ Google      │        └──────────────┘
   └──────┬──────┘
          │
          ▼
   ┌─────────────────────────┐
   │ CLIQUE SUR "Sign In"    │
   └──────┬──────────────────┘
          │
          ▼
   ┌─────────────────────────────────┐
   │ 2. AUTHENTIFICATION GOOGLE      │
   │    POST /auth/google            │
   │    └─ Reçoit token Google       │
   │    └─ Vérifie avec library      │
   │    └─ Crée user en BD           │
   │    └─ Enregistre session        │
   │    └─ Page reload               │
   └──────┬──────────────────────────┘
          │
          ▼ (Maintenant connecté)
   ┌────────────────────────┐
   │ 3. EXPLORE LIVRES      │
   │    GET /library        │
   │    └─ Affiche 20 livres│
   └──────┬─────────────────┘
          │
          ▼
   ┌────────────────────────┐
   │ 4. CLIQUE SUR UN LIVRE │
   │    GET /books/works/id │
   │    └─ Affiche détails  │
   │    └─ Couverture       │
   │    └─ Auteurs          │
   │    └─ Button "Ajouter" │
   └──────┬─────────────────┘
          │
          ▼
   ┌────────────────────────┐
   │ 5. AJOUTE À SA LISTE   │
   │    POST /books/status  │
   │    Status: 'wishlist'  │
   │    └─ Enregistre en BD │
   └──────┬─────────────────┘
          │
          ▼
   ┌────────────────────────┐
   │ 6. VIEW PROFIL         │
   │    GET /profil         │
   │    └─ Ses livres listed│
   │    └─ Stats            │
   └────────────────────────┘

   ┌────────────────────────┐
   │ LOGOUT                 │
   │ GET /logout            │
   │ └─ Détruit session     │
   │ └─ Redirect /          │
   └────────────────────────┘
```

---

## 🌐 APIs externes

### 1️⃣ Google OAuth 2.0
**Endpoint:** `https://accounts.google.com/`  
**Utilisé pour:** Authentification des utilisateurs  
**Retour:** JWT Token avec infos utilisateur  
**Vérification:** google-auth-library

### 2️⃣ OpenLibrary API
**URL de base:** `https://openlibrary.org`

#### Recherche de livres
```
GET /search.json?q=programming
└─ Retourne: { docs: [...livres...], numPages, total }
```

#### Détails d'un livre
```
GET /works/{work_id}.json      // Édition générale du livre
GET /editions/{edition_id}.json // Édition spécifique
└─ Retourne: { title, authors, covers, isbn, ... }
```

#### Détails d'un auteur
```
GET /authors/{author_id}.json
└─ Retourne: { name, birth_date, description, ... }
```

#### Images de couverture
```
GET https://covers.openlibrary.org/b/id/{cover_id}-L.jpg
└─ Tailles disponibles: -S (small), -M (medium), -L (large)
```

---

## 🔧 Configuration et démarrage

### Installation
```bash
npm install
```

### Lancement du serveur
```bash
npm start
# ou
node app.js
```

### Serveur démarrage
```
✅ Serveur lancé sur http://localhost:3000
✅ DB SQLite connectée
```

### Port
- **Production:** À déterminer (actuellement 3000)
- **Développement:** 3000 (localhost)

### Variables d'environnement (à ajouter)
- `CLIENT_ID` - Google OAuth Client ID
- `SESSION_SECRET` - Clé de chiffrement session
- `DATABASE_PATH` - Chemin BD SQLite
- `PORT` - Port serveur

---

## 🐛 Points techniques importants

### 1. Gestion des images Google
Google retourne des URLs avec des paramètres de redimensionnement (`=s10`). Le code clean les URLs:
```javascript
if (picture && picture.includes("=")) {
  picture = picture.split("=")[0];  // Supprime les params
}
```

### 2. Requêtes parallèles pour les auteurs
Pour récupérer tous les auteurs, les requêtes sont parallélisées:
```javascript
const authorPromises = bookData.authors.map(async (authorObj) => {
  const authorResponse = await fetch(...);
  return authorResponse.json().name;
});
authors = await Promise.all(authorPromises);
```

### 3. Unicité dans la BD
La table `library_status` utilise une clé composite `(user_id, api_book_id)`:
- Un utilisateur ne peut avoir qu'UN statut par livre
- Update automatique si déjà existant

### 4. Sessions persistantes
Express-session stocke les données en mémoire (défaut). Pour la production, utiliser un store externe (Redis, MongoDB).

---

## 🎯 Flux des données

```
┌──────────────────────────────────────────────────────────┐
│         DONNÉES UTILISATEUR                              │
├──────────────────────────────────────────────────────────┤
│ Création:    Google OAuth → POST /auth/google            │
│ Stockage:    TABLE users (BD SQLite)                     │
│ Session:     express-session (mémoire serveur)           │
│ Affichage:   res.locals.user (templates EJS)             │
└──────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│         DONNÉES DES LIVRES                               │
├──────────────────────────────────────────────────────────┤
│ Source:      OpenLibrary API (externe)                   │
│ Recherche:   GET /library                                │
│ Détails:     GET /books/:type/:id                        │
│ Couverture:  covers.openlibrary.org (CDN externe)        │
│ Stockage:    PAS stocké (requête en temps réel)          │
└──────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│         STATUT DES LIVRES (Utilisateur)                  │
├──────────────────────────────────────────────────────────┤
│ Création:    POST /books/status                          │
│ Stockage:    TABLE library_status (BD SQLite)            │
│ Format:      { user_id, api_book_id, status }            │
│ Status:      'wishlist', 'reading', 'completed',         │
│              'favorite'                                   │
└──────────────────────────────────────────────────────────┘
```

---

## ✅ Checklist d'implémentation

- [x] Authentification Google OAuth 2.0
- [x] Gestion des sessions utilisateur
- [x] Base de données SQLite
- [x] Recherche des livres (OpenLibrary API)
- [x] Détails des livres
- [x] Système de statut (wishlist, reading, etc.)
- [x] Page profil utilisateur
- [ ] Statistiques utilisateur (genres, auteurs)
- [ ] Page modifiction d'informations utilisateur
- [ ] Suppression de compte
- [ ] Partage de collection
- [ ] Commentaires/Notes sur les livres

---

## 🚀 Évolutions futures (Roadmap)

1. **Statistiques avancées**
   - Genres les plus lus
   - Auteurs préférés
   - Moyenne de noter
   - Temps de lecture

2. **Réseaux social**
   - Suivre d'autres utilisateurs
   - Voir leurs collections
   - Recommandations sociales

3. **Intégrations**
   - Goodreads API
   - Kindle Sync
   - PDF annotations

4. **Interface améliorée**
   - Dashboard personnalisé
   - Vue calendrier de lecture
   - Filtres/Tri avancés

---

## 📞 Support & Contact

- **Documentation utilisateur:** `README.md`
- **Trello du projet:** https://trello.com/b/YFQMKOXn/yboost-booktock
- **Roadmap Figma:** https://www.figma.com/board/e2WZnF9tmXjdSQ5vd765ko/road-map-book
- **Équipe:** Victoria, Hugo, Mathéo, Teddy (Yboost 2025-2026)

---

## 📝 Notes pour les IA

Cette documentation a été créée pour permettre une compréhension rapide du projet par n'importe quel agent IA. Voici les points clés à retenir:

1. **C'est une application Node.js + Express** avec une BD SQLite
2. **Authentification externe** via Google OAuth 2.0
3. **Données externes** exploitées depuis OpenLibrary API
4. **Architecture simple** mais modulaire (routes séparées)
5. **Gestion de session** côté serveur avec express-session
6. **Templates EJS** pour le rendu côté serveur
7. **Pas de framework frontal** (Vanilla JS uniquement)
8. **Base de données très simple** (3 tables principales)

Pour modifier/étendre le projet, commencez par ces fichiers:
- `app.js` - Structure générale
- `routes/*.js` - Pour ajouter/modifier des endpoints
- `views/pages/*.ejs` - Pour changer l'affichage
- `config/tables/*.js` - Pour ajouter des colonnes BD

Bon développement! 🚀
