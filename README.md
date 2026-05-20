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
- chat support Tawk.to configurable ;
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

## Chat Tawk.to

Ajouter les identifiants du widget dans `.env` :

```bash
TAWK_TO_PROPERTY_ID=votre_property_id
TAWK_TO_WIDGET_ID=default
```

## Administration

Un compte admin local est cree au demarrage avec les variables `.env` :

```bash
ADMIN_EMAIL=admin@maisonmada.local
ADMIN_PASSWORD=change-moi-123
```

Les annonces publiees par les membres passent en moderation avant d'apparaitre publiquement.

Dans Tawk.to, ces valeurs se trouvent dans le script d'integration :

```html
https://embed.tawk.to/PROPERTY_ID/WIDGET_ID
```

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
