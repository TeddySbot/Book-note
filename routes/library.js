// ═══════════════════════════════════════════════════════════════════════════════
// routes/library.js — Page d'exploration de livres via l'API OpenLibrary
// ═══════════════════════════════════════════════════════════════════════════════

const express = require('express');
const router = express.Router();
const CLIENT_ID = '754068118410-8s00fbmh36hst5e1aclmkf7v2ucp6mnb.apps.googleusercontent.com';
const db = require('../config/db');

// ── GET /library ──────────────────────────────────────────────────────────────
// Charge une liste de livres depuis OpenLibrary et pré-charge les statuts de
// l'utilisateur connecté pour afficher les badges dans la liste sans appel supplémentaire.
router.get('/', async (req, res) => {
    const user = req.session.user || null;
    let userStatuses = {}; // { "/works/OL123W": "favorite", ... }

    try {
        // Pré-charge tous les statuts de l'utilisateur en une seule requête
        if (user?.db_id) {
            const rows = await new Promise((resolve, reject) => {
                db.all(
                    `SELECT api_book_id, status FROM library_status WHERE user_id = ?`,
                    [user.db_id],
                    (err, rows) => err ? reject(err) : resolve(rows)
                );
            });
            rows.forEach(row => {
                userStatuses[row.api_book_id] = row.status;
            });
        }

        const response = await fetch("https://openlibrary.org/search.json?q=programming");
        const data = await response.json();
        const books = data.docs.slice(0);

        res.render('pages/library', {
            books,
            error: null,
            user,
            clientId: CLIENT_ID,
            userStatuses,
        });

    } catch (err) {
        console.error(err);
        res.render('pages/library', {
            books: null,
            error: "Erreur API OpenLibrary",
            user,
            clientId: CLIENT_ID,
            userStatuses: {},
        });
    }
});

module.exports = router;