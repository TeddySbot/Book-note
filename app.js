const express = require('express');
const path = require('path');
const app = express();

// Définir EJS comme moteur de vues
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Chemin des Routes
const indexRoute = require('./routes/index');

// Routes
app.use(express.static('public'));
app.use('/', indexRoute);

// Lancement du serveur
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Serveur lancé sur http://localhost:${PORT}`);
});
