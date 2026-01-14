require("./config/initDb");

const express = require('express');
const path = require('path');
const session = require('express-session');
const app = express();

const CLIENT_ID = '754068118410-8s00fbmh36hst5e1aclmkf7v2ucp6mnb.apps.googleusercontent.com';


// Définir EJS comme moteur de vues
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware pour body parsing
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Middleware de session
app.use(session({
    secret: 'ton_secret_super_secure', 
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 24 * 60 * 60 * 1000 } // 24h
}));


app.use((req, res, next) => {
    res.locals.user = req.session.user || null;
    res.locals.clientId = CLIENT_ID;
    next();
});


// Chemin des Routes
const indexRoute = require('./routes/index');
const profilRoute = require('./routes/profil');
const libraryRoute = require('./routes/library');
const booksRoute = require('./routes/books');

// Routes
app.use(express.static('public'));
app.use('/', indexRoute);
app.use('/profil', profilRoute);
app.use('/library', libraryRoute);
app.use('/books', booksRoute);

// Lancement du serveur
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Serveur lancé sur http://localhost:${PORT}`);
});
