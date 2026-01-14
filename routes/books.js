// routes/books.js
const express = require('express');
const router = express.Router();
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
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

        let authors = [];
        if (bookData.authors && bookData.authors.length > 0) {
            const authorPromises = bookData.authors.map(async (authorObj) => {
                try {
                    const authorResponse = await fetch(`https://openlibrary.org${authorObj.author.key}.json`);
                    const authorData = await authorResponse.json();
                    return authorData.name || 'Auteur inconnu';
                } catch (error) {
                    console.error('Erreur lors de la récupération de l\'auteur:', error);
                    return 'Auteur inconnu';
                }
            });
            authors = await Promise.all(authorPromises);
        }

        res.render('pages/books', {
            book: bookData,
            coverUrl,
            authors,
            user: req.session.user || null,
            clientId: CLIENT_ID
        });

    } catch (err) {
        console.error(err);
        res.status(500).send('Erreur lors de la récupération du livre.');
    }
});

module.exports = router;
