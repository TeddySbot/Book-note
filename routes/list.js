const express = require('express');
const router = express.Router();
const db = require('../config/db');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
const CLIENT_ID = '754068118410-8s00fbmh36hst5e1aclmkf7v2ucp6mnb.apps.googleusercontent.com';

router.get('/', async (req, res) => {
    if (!req.session.user){
        return res.redirect('/');
    }

    try {
        // Récupérer tous les statuts des livres pour l'utilisateur
        const statuses = await new Promise((resolve, reject) => {
            db.all(
                `SELECT api_book_id, status FROM library_status WHERE user_id = ?`,
                [req.session.user.db_id],
                (err, rows) => {
                    if (err) reject(err);
                    resolve(rows || []);
                }
            );
        });

        // Traiter les statuts et grouper les livres
        const books = {
            favorite: [],
            reading: [],
            completed: [],
            wishlist: []
        };

        // Récupérer les données de chaque livre depuis OpenLibrary
        for (const row of statuses) {
            try {
                const response = await fetch(`https://openlibrary.org${row.api_book_id}.json`);
                const bookData = await response.json();

                let coverUrl = null;
                if (bookData.covers && bookData.covers.length > 0) {
                    coverUrl = `https://covers.openlibrary.org/b/id/${bookData.covers[0]}-M.jpg`;
                }

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

                const book = {
                    key: row.api_book_id,
                    title: bookData.title || 'Sans titre',
                    authors: authors,
                    coverUrl: coverUrl
                };

                if (books[row.status]) {
                    books[row.status].push(book);
                }
            } catch (error) {
                console.error(`Erreur lors de la récupération du livre ${row.api_book_id}:`, error);
            }
        }

        res.render('pages/list', {
            user: req.session.user || null,
            clientId: CLIENT_ID,
            books: books
        });
    } catch (err) {
        console.error('Erreur lors de la récupération de la liste:', err);
        res.render('pages/list', {
            user: req.session.user || null,
            clientId: CLIENT_ID,
            books: { favorite: [], reading: [], completed: [], wishlist: [] }
        });
    }
});




module.exports = router;
