// ═══════════════════════════════════════════════════════════════════════════════
// routes/books.js — Détail d'un livre + gestion des statuts (ajout / suppression)
// Les clés de livre suivent le format OpenLibrary : "/works/OL123W"
// ═══════════════════════════════════════════════════════════════════════════════

const express = require('express');
const router = express.Router();
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
const CLIENT_ID = '754068118410-8s00fbmh36hst5e1aclmkf7v2ucp6mnb.apps.googleusercontent.com';
const db = require('../config/db');

// ── GET /books/:type/:id — Page de détail d'un livre ─────────────────────────
// Reconstitue la clé OpenLibrary depuis les paramètres d'URL (ex: /works/OL123W)
// et récupère le statut courant de l'utilisateur connecté pour pré-remplir le sélecteur.
router.get('/:type/:id', async (req, res) => {

    const bookKey = `/${req.params.type}/${req.params.id}`;
    const user = req.session.user || null;

    try {
        const response = await fetch(`https://openlibrary.org${bookKey}.json`);
        const bookData = await response.json();

        let coverUrl = null;
        if (bookData.covers && bookData.covers.length > 0) {
            coverUrl = `https://covers.openlibrary.org/b/id/${bookData.covers[0]}-L.jpg`;
        }

        // Chaque auteur nécessite un appel séparé à OpenLibrary pour récupérer son nom
        let authors = [];
        if (bookData.authors && bookData.authors.length > 0) {
            const authorPromises = bookData.authors.map(async (authorObj) => {
                try {
                    const authorResponse = await fetch(`https://openlibrary.org${authorObj.author.key}.json`);
                    const authorData = await authorResponse.json();
                    return authorData.name || 'Auteur inconnu';
                } catch (error) {
                    return 'Auteur inconnu';
                }
            });
            authors = await Promise.all(authorPromises);
        }

        // Récupère le statut actuel de ce livre pour l'utilisateur connecté
        let currentStatus = null;
        if (user && user.db_id) {
            await new Promise((resolve) => {
                db.get(
                    `SELECT status FROM library_status WHERE user_id = ? AND api_book_id = ?`,
                    [user.db_id, bookKey],
                    (err, row) => {
                        if (!err && row) currentStatus = row.status;
                        resolve();
                    }
                );
            });
        }

        res.render('pages/books', {
            book: bookData,
            coverUrl,
            authors,
            user,
            currentStatus,
            clientId: CLIENT_ID,
        });

    } catch (err) {
        console.error(err);
        res.status(500).send('Erreur lors de la récupération du livre.');
    }
});

// ── POST /books/status — Ajouter ou modifier le statut d'un livre ─────────────
// Utilise un upsert : crée l'entrée si elle n'existe pas, la met à jour sinon.
// Statuts possibles : "favorite" | "reading" | "completed" | "wishlist"
router.post('/status', (req, res) => {
    const { api_book_id, status } = req.body;
    const user = req.session.user;

    if (!user || !user.db_id || !api_book_id || !status) {
        console.log('❌ Données manquantes');
        return res.status(400).json({ error: 'Données manquantes' });
    }

    db.run(
        `INSERT INTO library_status (user_id, api_book_id, status)
         VALUES (?, ?, ?)
         ON CONFLICT(user_id, api_book_id)
         DO UPDATE SET status=excluded.status, updated_at=CURRENT_TIMESTAMP`,
        [user.db_id, api_book_id, status],
        function (err) {
            if (err) {
                console.log('❌ Erreur DB:', err.message);
                return res.status(500).json({ error: err.message });
            }
            res.json({ message: 'Statut enregistré avec succès !' });
        }
    );
});

// ── POST /books/status/delete — Retirer un livre de la collection ─────────────
router.post('/status/delete', (req, res) => {
    const { api_book_id } = req.body;
    const user = req.session.user;

    if (!user || !user.db_id || !api_book_id) {
        console.log('❌ Données manquantes pour la suppression');
        return res.status(400).json({ error: 'Données manquantes' });
    }

    db.run(
        `DELETE FROM library_status WHERE user_id = ? AND api_book_id = ?`,
        [user.db_id, api_book_id],
        function (err) {
            if (err) {
                console.log('❌ Erreur DB lors de la suppression:', err.message);
                return res.status(500).json({ error: err.message });
            }
            console.log('✅ Livre supprimé avec succès');
            res.json({ message: 'Livre supprimé de votre collection !' });
        }
    );
});


module.exports = router;
