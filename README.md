 # Parterre

Plateforme de réservation de places numérotées pour cinéma et théâtre. Application React, API REST Express, PostgreSQL et mises à jour du plan en direct avec Socket.IO.

## Lancement avec Docker

Docker Compose démarre PostgreSQL, crée les tables, prépare une programmation de démonstration et sert l'application sur le port 3000 :

```sh
docker compose up --build
```

Ouvrir http://localhost:3000. Pour arrêter : `docker compose down`. Les données sont conservées dans le volume Docker `donnees_postgres` : `docker compose down` les garde, mais `docker compose down -v` les **efface**.

L’inscription et la connexion sont disponibles sur `/inscription` et `/connexion`. Les opérations protégées utilisent le jeton JWT renvoyé après l’authentification.

Pour créer le premier compte gestionnaire, définissez `INITIAL_ADMIN_NAME`, `INITIAL_ADMIN_EMAIL` et `INITIAL_ADMIN_PASSWORD` dans l’environnement avant le démarrage du serveur. Le mot de passe doit contenir au moins 12 caractères. Le compte est créé uniquement si son adresse courriel n’existe pas déjà. En production, configurez ces valeurs dans les secrets de l’hébergeur; ne réutilisez pas les identifiants de test locaux.

## Lancement de développement

Prérequis : Node.js 22 ou plus récent, npm et PostgreSQL. Créez une base `parterre` et copiez `.env.example` en `.env`, puis :

```sh
npm install
npm run dev
```

Le client est servi sur http://localhost:5173 et l’API sur http://localhost:4000. `npm run build` produit le client de production. Au premier démarrage, l’API crée le schéma et quelques séances d’exemple.

## Organisation du code

```text
src/
	pages/          # Écrans React
	components/     # Composants partagés
	services/       # Appels API
	types.ts        # Types utilisés par le client
	App.tsx         # Cadre et routes React
server/
	db/             # Connexion PostgreSQL
	middleware/     # Authentification et gestion des erreurs asynchrones
	index.ts        # Routes API, Socket.IO et démarrage
database/         # Schéma et initialisation SQL
docs/             # Conception et organisation de l’équipe
```

## Routes de l’application

| Route | Description |
|---|---|
| `/` | Programmation et filtres par genre |
| `/seances/:id` | Plan de salle, places en direct et confirmation |
| `/mes-reservations` | Billets et annulation |
| `/gestion/seances/nouvelle` | Programmation d’une séance, gestionnaire uniquement |

## API REST

| Méthode | Endpoint | Accès |
|---|---|---|
| `POST` | `/api/auth/inscription` | Public |
| `POST` | `/api/auth/connexion` | Public |
| `GET` | `/api/seances` | Public |
| `GET` | `/api/seances/:id/plan` | Public |
| `POST` | `/api/seances/:id/places/:placeId/retenir` | Connecté |
| `POST` | `/api/reservations` | Connecté |
| `GET` | `/api/reservations` | Connecté |
| `DELETE` | `/api/reservations/:id` | Propriétaire |
| `POST` | `/api/seances` | Gestionnaire |

Socket.IO diffuse `place:etat_change` et `place:retenue_expiree` par salle. Les actions de modification restent exclusivement sur l’API REST. La gestion des conflits entre réservations simultanées n’est pas encore implémentée.

La documentation détaillée du projet et les décisions techniques restent disponibles dans `docs/`.
 
## Ce qui est simulé dans l'alpha

| Élément | Ce qui est simulé | Ce qui le remplacera | Sprint |
|---|---|---|---|
| Paiement | Aucun paiement en ligne : le total affiché est indicatif (« paiement sur place ») et la réservation est confirmée sans carte | Rien, le paiement réel est hors portée du projet (#21) | — |
| Tarif | Prix fixe de 14,50 $ par place, écrit dans le code du serveur et de l'écran | Tarifs réduits et catégories de prix (#15) | 3 |
| Films et séances | 3 films de démonstration et des séances de démo recréées au démarrage de l'application, seulement s'il n'en reste aucune à venir | Séances créées par le gestionnaire (#3) | 1 |
| Affiches | Images chargées depuis Unsplash (site externe) | Images hébergées dans le projet | À décider (aucun récit au backlog) |

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