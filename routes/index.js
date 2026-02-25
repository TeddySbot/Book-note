const express = require('express');
const router = express.Router();
const { OAuth2Client } = require('google-auth-library');
const db = require('../config/db');
const CLIENT_ID = '754068118410-8s00fbmh36hst5e1aclmkf7v2ucp6mnb.apps.googleusercontent.com';
const client = new OAuth2Client(CLIENT_ID);

// Page d'accueil
router.get('/', (req, res) => {
    res.render('pages/index');
});



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
            `INSERT INTO users (email, username, local) VALUES (?, ?, ?) ON CONFLICT(email) DO UPDATE SET username=excluded.username, local=excluded.local`,
            [payload.email, payload.name, payload.locale],
            function(err) {
                if (err) {
                    console.error('❌ DB write error:', err.message);
                    return res.status(500).json({ success: false, error: 'Erreur BD' });
                }

                // Récupère l'ID de la BD après l'insertion
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

// Déconnexion
router.get('/logout', (req, res) => {
    req.session.destroy(() => {
        res.redirect('/');
    });
});

module.exports = router;
