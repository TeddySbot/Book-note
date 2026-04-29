// Crée les tables SQLite au démarrage si elles n'existent pas encore
require("./config/initDb");

const express = require('express');
const path = require('path');
const session = require('express-session');
const app = express();

require('dotenv').config();
const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;

// ── Moteur de vues ────────────────────────────────────────────────────────────
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(session({
    secret: 'ton_secret_super_secure',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 24 * 60 * 60 * 1000 } // 24h
}));

// Injecte l'utilisateur de session et le clientId Google dans toutes les vues EJS
app.use((req, res, next) => {
    res.locals.user = req.session.user || null;
    res.locals.clientId = CLIENT_ID;
    next();
});

// ── Routes ────────────────────────────────────────────────────────────────────
const indexRoute = require('./routes/index');   // / — accueil + auth
const profilRoute = require('./routes/profil'); // /profil
const libraryRoute = require('./routes/library'); // /library — exploration
const booksRoute = require('./routes/books');   // /books/:type/:id — détail + statuts
const listRoute = require('./routes/list');     // /list — collection personnelle

app.use(express.static('public'));
app.use('/', indexRoute);
app.use('/profil', profilRoute);
app.use('/library', libraryRoute);
app.use('/list', listRoute);
app.use('/books', booksRoute);

// ── Démarrage ─────────────────────────────────────────────────────────────────
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Serveur lancé sur http://localhost:${PORT}`);
});
