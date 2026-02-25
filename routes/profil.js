const express = require('express');
const router = express.Router();
const CLIENT_ID = '754068118410-8s00fbmh36hst5e1aclmkf7v2ucp6mnb.apps.googleusercontent.com';
const db = require('../config/db');

// Fonction helper pour récupérer les infos d'un livre depuis OpenLibrary
async function getBookFromOpenLibrary(bookKey) {
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
                    return 'Auteur inconnu';
                }
            });
            authors = await Promise.all(authorPromises);
        }

        return {
            key: bookKey,
            title: bookData.title || 'Titre inconnu',
            authors: authors,
            coverUrl: coverUrl,
            isbn: bookData.isbn ? bookData.isbn[0] : null,
            description: bookData.description || 'Pas de description'
        };
    } catch (error) {
        console.error('Erreur OpenLibrary:', error);
        return null;
    }
}

router.get('/', (req, res) => {
    if (!req.session.user){
        return res.redirect('/');
    }

    res.render('pages/profil', {
        user: req.session.user || null,
        clientId: CLIENT_ID
    });
});

// Route pour afficher la liste des livres par catégories
router.get('/list', async (req, res) => {
    if (!req.session.user || !req.session.user.db_id) {
        return res.redirect('/');
    }

    try {
        const userId = req.session.user.db_id;

        db.all(
            `SELECT api_book_id, status FROM library_status WHERE user_id = ? ORDER BY status, created_at DESC`,
            [userId],
            async (err, rows) => {
                if (err) {
                    console.error('❌ DB error:', err.message);
                    return res.render('pages/list', {
                        user: req.session.user,
                        clientId: CLIENT_ID,
                        books: {}
                    });
                }

                const booksFormatted = {
                    wishlist: [],
                    reading: [],
                    completed: [],
                    favorite: []
                };

                const bookDetails = await Promise.all(
                    (rows || []).map(async (row) => {
                        const bookInfo = await getBookFromOpenLibrary(row.api_book_id);
                        if (bookInfo) {
                            return { ...bookInfo, status: row.status };
                        }
                        return null;
                    })
                );

                bookDetails.forEach(book => {
                    if (book && booksFormatted[book.status]) {
                        booksFormatted[book.status].push(book);
                    }
                });

                res.render('pages/list', {
                    user: req.session.user,
                    clientId: CLIENT_ID,
                    books: booksFormatted
                });
            }
        );
    } catch (error) {
        console.error('Erreur:', error);
        res.render('pages/list', {
            user: req.session.user,
            clientId: CLIENT_ID,
            books: {}
        });
    }
});

module.exports = router;
