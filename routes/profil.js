const express = require('express');
const router = express.Router();
const CLIENT_ID = '754068118410-8s00fbmh36hst5e1aclmkf7v2ucp6mnb.apps.googleusercontent.com';

router.get('/', (req, res) => {
    if (!req.session.user){
        return res.redirect('/');
    }

    res.render('pages/profil', {
        user: req.session.user || null,
        clientId: CLIENT_ID
    });
});




module.exports = router;
