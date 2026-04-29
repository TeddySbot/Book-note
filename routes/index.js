// ═══════════════════════════════════════════════════════════════════════════════
// routes/index.js — Page d'accueil + authentification (Google OAuth & local)
// ═══════════════════════════════════════════════════════════════════════════════

const express = require('express');
const bcrypt = require('bcryptjs');
const router = express.Router();
const { OAuth2Client } = require('google-auth-library');
const db = require('../config/db');
require('dotenv').config();
const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const client = new OAuth2Client(CLIENT_ID);

// ── Helpers OpenLibrary ───────────────────────────────────────────────────────

// Cache en mémoire pour éviter de re-requêter les sujets d'un même livre
const subjectCache = new Map();

async function getBookSubjects(bookKey) {
    if (subjectCache.has(bookKey)) return subjectCache.get(bookKey);
    try {
        const response = await fetch(`https://openlibrary.org${bookKey}.json`);
        const data = await response.json();
        const subjects = data.subjects?.slice(0, 3) || [];
        subjectCache.set(bookKey, subjects);
        return subjects;
    } catch {
        return [];
    }
}

async function searchBySubject(subject) {
    try {
        const encoded = encodeURIComponent(subject);
        const response = await fetch(
            `https://openlibrary.org/search.json?subject=${encoded}&limit=6&fields=key,title,author_name,cover_i`
        );
        const data = await response.json();
        return data.docs || [];
    } catch {
        return [];
    }
}

// Récupère titre, auteurs et couverture d'un livre depuis son clé OpenLibrary
async function getBookDetails(bookKey) {
    try {
        const response = await fetch(`https://openlibrary.org${bookKey}.json`);
        const data = await response.json();

        let authors = [];
        if (data.authors?.length > 0) {
            const authorPromises = data.authors.map(async (a) => {
                try {
                    const r = await fetch(`https://openlibrary.org${a.author.key}.json`);
                    const d = await r.json();
                    return d.name || 'Auteur inconnu';
                } catch {
                    return 'Auteur inconnu';
                }
            });
            authors = await Promise.all(authorPromises);
        }

        const coverUrl = data.covers?.length > 0
            ? `https://covers.openlibrary.org/b/id/${data.covers[0]}-M.jpg`
            : null;

        return {
            key: bookKey,
            title: data.title || 'Titre inconnu',
            authors,
            coverUrl,
        };
    } catch {
        return { key: bookKey, title: 'Titre inconnu', authors: [], coverUrl: null };
    }
}

// Cache des tendances avec TTL d'1h pour limiter les appels à OpenLibrary
let trendingCache = { books: [], fetchedAt: 0 };
const TRENDING_TTL = 1000 * 60 * 60; // 1 heure

async function getTrendingBooks() {
    const now = Date.now();
    if (trendingCache.books.length > 0 && now - trendingCache.fetchedAt < TRENDING_TTL) {
        return trendingCache.books;
    }

    try {
        const response = await fetch(
            'https://openlibrary.org/search.json?q=subject:fiction&sort=rating&limit=20&fields=key,title,author_name,cover_i'
        );
        const data = await response.json();

        const books = (data.docs || [])
            .filter(b => b.cover_i)
            .slice(0, 12)
            .map(b => ({
                key: b.key,
                title: b.title,
                author: b.author_name ? b.author_name[0] : 'Auteur inconnu',
                coverUrl: `https://covers.openlibrary.org/b/id/${b.cover_i}-M.jpg`,
            }));

        trendingCache = { books, fetchedAt: now };
        return books;
    } catch {
        return [];
    }
}

// ── Page d'accueil ────────────────────────────────────────────────────────────
// Charge les tendances pour tous, et les recommandations + livres terminés pour les connectés.
// Les recommandations sont générées à partir des sujets des livres favoris/terminés de l'utilisateur.
router.get('/', async (req, res) => {
    const user = req.session.user || null;
    let recommendations = [];
    let completedBooks = [];
    let trendingBooks = [];

    try {
        trendingBooks = await getTrendingBooks();

        if (user?.db_id) {

            // ── Recommandations ──────────────────────────────────────
            // 1. Récupère les livres favoris/terminés de l'utilisateur
            // 2. Extrait leurs sujets via OpenLibrary
            // 3. Cherche d'autres livres partageant ces sujets
            // 4. Filtre les livres déjà dans la collection
            const userBooks = await new Promise((resolve, reject) => {
                db.all(
                    `SELECT api_book_id FROM library_status
                     WHERE user_id = ? AND status IN ('favorite', 'completed')`,
                    [user.db_id],
                    (err, rows) => err ? reject(err) : resolve(rows)
                );
            });

            if (userBooks.length > 0) {
                const subjectsArrays = await Promise.all(
                    userBooks.slice(0, 10).map(row => getBookSubjects(row.api_book_id))
                );

                const allSubjects = [...new Set(subjectsArrays.flat())].slice(0, 5);

                if (allSubjects.length > 0) {
                    const resultsArrays = await Promise.all(
                        allSubjects.map(subject => searchBySubject(subject))
                    );

                    const userBookIds = new Set(userBooks.map(b => b.api_book_id));
                    const seen = new Set();

                    recommendations = resultsArrays
                        .flat()
                        .filter(book => {
                            if (!book.key || seen.has(book.key) || userBookIds.has(book.key)) return false;
                            seen.add(book.key);
                            return true;
                        })
                        .slice(0, 12)
                        .map(book => ({
                            key: book.key,
                            title: book.title,
                            authors: book.author_name || ['Auteur inconnu'],
                            coverUrl: book.cover_i
                                ? `https://covers.openlibrary.org/b/id/${book.cover_i}-M.jpg`
                                : null,
                        }));
                }
            }

            // ── Livres terminés ──────────────────────────────────────
            const completedRows = await new Promise((resolve, reject) => {
                db.all(
                    `SELECT api_book_id FROM library_status
                     WHERE user_id = ? AND status = 'completed'`,
                    [user.db_id],
                    (err, rows) => err ? reject(err) : resolve(rows)
                );
            });

            if (completedRows.length > 0) {
                completedBooks = await Promise.all(
                    completedRows.map(row => getBookDetails(row.api_book_id))
                );
            }
        }

        res.render('pages/index', {
            user,
            clientId: CLIENT_ID,
            recommendations,
            completedBooks,
            trendingBooks,
        });

    } catch (err) {
        console.error('Erreur page accueil:', err);
        res.render('pages/index', {
            user,
            clientId: CLIENT_ID,
            recommendations: [],
            completedBooks: [],
            trendingBooks: [],
        });
    }
});

// ── Auth Google ───────────────────────────────────────────────────────────────
// Reçoit le token Google depuis le client, le vérifie, puis crée ou met à jour
// l'utilisateur en base (upsert) avant d'ouvrir la session.
router.post('/auth/google', async (req, res) => {
    const { credential } = req.body;

    try {
        const ticket = await client.verifyIdToken({
            idToken: credential,
            audience: CLIENT_ID
        });

        const payload = ticket.getPayload();

        // Supprime les paramètres de taille de l'URL de la photo Google
        let picture = payload.picture;
        if (picture && picture.includes("=")) {
            picture = picture.split("=")[0];
        }

        db.run(
            `INSERT INTO users (email, username, local) VALUES (?, ?, ?)
             ON CONFLICT(email) DO UPDATE SET username=excluded.username, local=excluded.local`,
            [payload.email, payload.name, payload.locale],
            function(err) {
                if (err) {
                    console.error('❌ DB write error:', err.message);
                    return res.status(500).json({ success: false, error: 'Erreur BD' });
                }

                db.get('SELECT id FROM users WHERE email = ?', [payload.email], (err, row) => {
                    if (err || !row) {
                        console.error('❌ DB read error:', err?.message);
                        return res.status(500).json({ success: false, error: 'Erreur BD' });
                    }

                    req.session.user = {
                        id: payload.sub,
                        db_id: row.id,
                        name: payload.name,
                        email: payload.email,
                        picture: picture,
                        locale: payload.locale,
                    };

                    res.json({ success: true, user: req.session.user });
                });
            }
        );
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
});

// ── Déconnexion ───────────────────────────────────────────────────────────────
router.get('/logout', (req, res) => {
    req.session.destroy(() => {
        res.redirect('/');
    });
});

// ── Auth locale : Inscription ─────────────────────────────────────────────────
// Crée un utilisateur dans `users` puis stocke le hash du mot de passe dans `auth_providers`
router.post('/auth/register', async (req, res) => {
    const { email, password, username } = req.body;
    if (!email || !password) return res.status(400).json({ success: false, error: 'Email et mot de passe requis' });

    try {
        const hash = await bcrypt.hash(password, 12);

        db.run(
            `INSERT INTO users (email, username) VALUES (?, ?)`,
            [email, username || email.split('@')[0]],
            function(err) {
                if (err) return res.status(400).json({ success: false, error: 'Email déjà utilisé' });

                const userId = this.lastID;
                db.run(
                    `INSERT INTO auth_providers (user_id, provider, password_hash) VALUES (?, 'local', ?)`,
                    [userId, hash],
                    (err2) => {
                        if (err2) return res.status(500).json({ success: false, error: 'Erreur BD' });

                        req.session.user = {
                            db_id: userId,
                            name: username || email.split('@')[0],
                            email,
                            picture: '/picture/NoK_BoK.png',
                        };
                        res.json({ success: true, user: req.session.user });
                    }
                );
            }
        );
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

// ── Auth locale : Connexion ───────────────────────────────────────────────────
router.post('/auth/login', (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ success: false, error: 'Email et mot de passe requis' });

    db.get(`SELECT u.id, u.email, u.username, u.local, ap.password_hash
            FROM users u JOIN auth_providers ap ON ap.user_id = u.id
            WHERE u.email = ? AND ap.provider = 'local'`,
        [email],
        async (err, row) => {
            if (err || !row) return res.status(401).json({ success: false, error: 'Email ou mot de passe incorrect' });

            const valid = await bcrypt.compare(password, row.password_hash);
            if (!valid) return res.status(401).json({ success: false, error: 'Email ou mot de passe incorrect' });

            req.session.user = {
                db_id: row.id,
                name: row.username,
                email: row.email,
                picture: '/picture/NoK_BoK.png',
                locale: row.local,
            };
            res.json({ success: true, user: req.session.user });
        }
    );
});


module.exports = router;