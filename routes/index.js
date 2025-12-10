const express = require('express');
const router = express.Router();
const { OAuth2Client } = require('google-auth-library');

const CLIENT_ID = '754068118410-8s00fbmh36hst5e1aclmkf7v2ucp6mnb.apps.googleusercontent.com';
const client = new OAuth2Client(CLIENT_ID);

// Page d'accueil
router.get('/', (req, res) => {
    res.render('pages/index', { clientId: CLIENT_ID, user: req.session.user });
});



// Vérifier le token Google et créer la session
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

        req.session.user = {
            id: payload.sub,
            name: payload.name,
            email: payload.email,
            picture: picture,
            firstname: payload.given_name,
            lastname: payload.family_name,
            locale: payload.locale,
            email_verified: payload.email_verified
        };

        console.log("User session:", req.session.user);


        res.json({ success: true, user: req.session.user });
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
