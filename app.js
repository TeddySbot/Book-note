const express = require('express');
const path = require('path');
const session = require('express-session');
const app = express();

// Définir EJS comme moteur de vues
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware pour body parsing
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Middleware de session
app.use(session({
    secret: 'ton_secret_super_secure', // change par une clé aléatoire
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 24 * 60 * 60 * 1000 } // 24h
}));

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
