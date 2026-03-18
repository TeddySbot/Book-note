const express = require('express');
const router = express.Router();
const CLIENT_ID = '754068118410-8s00fbmh36hst5e1aclmkf7v2ucp6mnb.apps.googleusercontent.com';
const db = require('../config/db');

router.get('/', async (req, res) => {
    if (!req.session.user) {
        return res.redirect('/');
    }

    const userId = req.session.user.db_id;

    try {
        // Compte par statut
        const stats = await new Promise((resolve, reject) => {
            db.all(
                `SELECT status, COUNT(*) as count
                 FROM library_status
                 WHERE user_id = ?
                 GROUP BY status`,
                [userId],
                (err, rows) => err ? reject(err) : resolve(rows)
            );
        });

        // Date d'inscription
        const userInfo = await new Promise((resolve, reject) => {
            db.get(
                `SELECT created_at FROM users WHERE id = ?`,
                [userId],
                (err, row) => err ? reject(err) : resolve(row)
            );
        });

        // Dernier livre ajouté
        const lastBook = await new Promise((resolve, reject) => {
            db.get(
                `SELECT api_book_id, status, updated_at
                 FROM library_status
                 WHERE user_id = ?
                 ORDER BY updated_at DESC
                 LIMIT 1`,
                [userId],
                (err, row) => err ? reject(err) : resolve(row)
            );
        });

        // Formater les stats en objet simple
        const statsMap = { favorite: 0, reading: 0, completed: 0, wishlist: 0 };
        stats.forEach(row => { statsMap[row.status] = row.count; });
        const totalBooks = Object.values(statsMap).reduce((a, b) => a + b, 0);

        res.render('pages/profil', {
            user: req.session.user,
            clientId: CLIENT_ID,
            stats: statsMap,
            totalBooks,
            memberSince: userInfo?.created_at || null,
            lastBook: lastBook || null,
        });

    } catch (err) {
        console.error('Erreur profil:', err);
        res.render('pages/profil', {
            user: req.session.user,
            clientId: CLIENT_ID,
            stats: { favorite: 0, reading: 0, completed: 0, wishlist: 0 },
            totalBooks: 0,
            memberSince: null,
            lastBook: null,
        });
    }
});

module.exports = router;