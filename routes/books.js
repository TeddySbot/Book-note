// routes/books.js
const express = require('express');
const router = express.Router();
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const CLIENT_ID = '754068118410-8s00fbmh36hst5e1aclmkf7v2ucp6mnb.apps.googleusercontent.com';

router.get('/:type/:id', async (req, res) => {

    const bookKey = `/${req.params.type}/${req.params.id}`;

    try {
        const response = await fetch(`https://openlibrary.org${bookKey}.json`);
        const bookData = await response.json();

        let coverUrl = null;
        if (bookData.covers && bookData.covers.length > 0) {
            coverUrl = `https://covers.openlibrary.org/b/id/${bookData.covers[0]}-L.jpg`;
        }

        res.render('pages/books', { 
            book: bookData, 
            coverUrl, 
            user: req.session.user || null,
            clientId: CLIENT_ID
        });

    } catch (err) {
        console.error(err);
        res.status(500).send('Erreur lors de la récupération du livre.');
    }
});

module.exports = router;
