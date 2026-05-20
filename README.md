# MaisonMada

Application immobiliere reconstruite depuis zero avec Node.js, Express, MongoDB et un front HTML/CSS/JS.

## Fonctionnalites

- recherche et filtrage des annonces ;
- espace membre avec inscription, connexion et deconnexion ;
- publication d'annonce reservee aux membres connectes ;
- upload d'image depuis l'appareil dans `public/uploads/` ;
- liste des annonces du membre ;
- favoris cote navigateur ;
- mode sombre persistant ;
- chat natif avec Socket.IO ;
- compte administrateur avec moderation des annonces.

## Lancement

```bash
npm install
mongod --dbpath .data/db --bind_ip 127.0.0.1 --port 27017
npm start
```

Ouvrir ensuite :

```text
http://localhost:3000
```

## Administration

Un compte admin local est cree au demarrage avec les variables `.env` :

```bash
ADMIN_EMAIL=admin@maisonmada.local
ADMIN_PASSWORD=change-moi-123
```

Les annonces publiees par les membres passent en moderation avant d'apparaitre publiquement.

## Architecture

```text
server.js
src/app.js
src/config/database.js
src/controllers/
src/middlewares/
src/models/
src/routes/
src/data/
public/
```
