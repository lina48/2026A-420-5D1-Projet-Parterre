 # Parterre

Plateforme de réservation de places numérotées pour cinéma et théâtre. Application React, API REST Express, PostgreSQL et mises à jour du plan en direct avec Socket.IO.

## Lancement avec Docker

Docker Compose démarre PostgreSQL, crée les tables, prépare une programmation de démonstration et sert l’application sur le port 4000 :

```sh
docker compose up --build
```

Ouvrir http://localhost:4000. Pour arrêter : `docker compose down`. Les données sont conservées dans le volume Docker `parterre-data`.

Compte gestionnaire de démonstration : `gestion@parterre.local` / `Parterre2026!`. En production, définissez un `JWT_SECRET` privé et supprimez le compte de démonstration.

## Lancement de développement

Prérequis : Node.js 22 ou plus récent, npm et PostgreSQL. Créez une base `parterre` et copiez `.env.example` en `.env`, puis :

```sh
npm install
npm run dev
```

Le client est servi sur http://localhost:5173 et l’API sur http://localhost:4000. `npm run build` produit le client de production. Au premier démarrage, l’API crée le schéma et quelques séances d’exemple.

## Routes de l’application

| Route | Description |
|---|---|
| `/` | Programmation et filtres par genre |
| `/seances/:id` | Plan de salle, places en direct et confirmation |
| `/connexion` | Connexion spectateur ou gestionnaire |
| `/inscription` | Création d’un compte spectateur |
| `/mes-reservations` | Billets et annulation |
| `/gestion/seances/nouvelle` | Programmation d’une séance, gestionnaire uniquement |

## API REST

| Méthode | Endpoint | Accès |
|---|---|---|
| `POST` | `/api/auth/inscription` | Public |
| `POST` | `/api/auth/connexion` | Public |
| `GET` | `/api/auth/moi` | Connecté |
| `GET` | `/api/seances` | Public |
| `GET` | `/api/seances/:id/plan` | Public |
| `POST` | `/api/seances/:id/places/:placeId/retenir` | Connecté |
| `POST` | `/api/reservations` | Connecté |
| `GET` | `/api/reservations` | Connecté |
| `DELETE` | `/api/reservations/:id` | Propriétaire |
| `POST` | `/api/seances` | Gestionnaire |

Socket.IO diffuse `place:etat_change` et `place:retenue_expiree` par salle. Les actions de modification restent exclusivement sur l’API REST. La gestion des conflits entre réservations simultanées n’est pas encore implémentée.

La documentation détaillée du projet et les décisions techniques restent disponibles dans `docs/`.
 

## Documentation

| Document | Contenu |
|---|---|
| [01-vision.md](docs/01-vision.md) | Problème, personnes utilisatrices, portée, exigences et technologies |
| [02-backlog.md](docs/02-backlog.md) | Épiques, récits `must` ordonnés, démarche d'estimation |
| [03-conception.md](docs/03-conception.md) | Modèle de données, routes, événements temps réel, décisions techniques |
| [maquettes/](docs/maquettes/) | Écrans clés annotés, dont la sélection en direct |
| [04-sprints.md](docs/04-sprints.md) | Objectif et incrément par sprint, capacité, ordre d'abandon |
| [05-equipe.md](docs/05-equipe.md) | Rôles, rituels, définition de « terminé », conventions |
| [06-risques.md](docs/06-risques.md) | Risques, signaux d'alerte|
| [journal.md](docs/journal.md) | Journal de bord, une entrée par bloc de cours | 

Le backlog vit dans les [issues](../../issues) : un ticket par récit, étiqueté par priorité, épique, points et sprint. 