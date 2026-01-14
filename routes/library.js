const express = require('express');
const router = express.Router();
const CLIENT_ID = '754068118410-8s00fbmh36hst5e1aclmkf7v2ucp6mnb.apps.googleusercontent.com';


router.get('/', async (req, res) => {
    try {
        const response = await fetch("https://openlibrary.org/search.json?q=programming");
        const data = await response.json();
        const books = data.docs.slice(0); 

        res.render('pages/library', { 
            books, 
            error: null,
            user: req.session.user || null,
            clientId: CLIENT_ID
         });

    } catch (err) {
        console.error(err);
        res.render('pages/library', { books: null, error: "Erreur API OpenLibrary" });
    }
});

module.exports = router;



