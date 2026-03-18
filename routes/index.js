const express = require('express');
const router = express.Router();
const { OAuth2Client } = require('google-auth-library');
const db = require('../config/db');
const CLIENT_ID = '754068118410-8s00fbmh36hst5e1aclmkf7v2ucp6mnb.apps.googleusercontent.com';
const client = new OAuth2Client(CLIENT_ID);

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

// Cache pour les tendances (évite de refaire l'appel à chaque visite)
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

// ─── Page d'accueil ───────────────────────────────────────────────────
router.get('/', async (req, res) => {
    const user = req.session.user || null;
    let recommendations = [];
    let completedBooks = [];
    let trendingBooks = [];

    try {
        // Tendances : toujours chargées, connecté ou non
        trendingBooks = await getTrendingBooks();

        if (user?.db_id) {

            // ── Recommandations ──────────────────────────────────────
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

// ─── Auth Google ──────────────────────────────────────────────────────
router.post('/auth/google', async (req, res) => {
    const { credential } = req.body;

    try {
        const ticket = await client.verifyIdToken({
            idToken: credential,
            audience: CLIENT_ID
        });

        const payload = ticket.getPayload();

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

// ─── Déconnexion ──────────────────────────────────────────────────────
router.get('/logout', (req, res) => {
    req.session.destroy(() => {
        res.redirect('/');
    });
});

module.exports = router;