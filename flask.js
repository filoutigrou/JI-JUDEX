const express = require('express');
const app = express();

// Port utilisé par le serveur (par défaut 3000 ou un autre si fourni par Render)
const PORT = process.env.PORT || 3000;

// Route principale pour la page web
app.get('/', (req, res) => {
    res.send('Bonjour ! Le site est en ligne.');
});

// Route pour Uptime Robot (optionnelle)
app.get('/ping', (req, res) => {
    res.status(200).send('Pong !');
});

// Lancement du serveur
app.listen(PORT, () => {
    console.log(`Serveur démarré sur http://localhost:${PORT}`);
});
