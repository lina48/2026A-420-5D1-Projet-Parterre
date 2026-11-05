 # Parterre

Plateforme de réservation de places numérotées pour cinéma et théâtre. Application React, API REST Express, PostgreSQL et mises à jour du plan en direct avec Socket.IO.

## Lancement avec Docker

Docker Compose démarre PostgreSQL, crée les tables, prépare une programmation de démonstration et sert l'application sur le port 3000 :

```sh
docker compose up --build
```

Ouvrir http://localhost:3000. Mailpit reçoit les courriels de test envoyés par l'application; consultez-les sur http://localhost:8025. Ces courriels ne sont pas transmis à de vraies adresses. Pour arrêter : `docker compose down`. Les données sont conservées dans le volume Docker `donnees_postgres` : `docker compose down` les garde, mais `docker compose down -v` les **efface**.

L’inscription et la connexion sont disponibles sur `/inscription` et `/connexion`. Les opérations protégées utilisent le jeton JWT renvoyé après l’authentification.

Pour créer le premier compte gestionnaire, définissez `INITIAL_ADMIN_NAME`, `INITIAL_ADMIN_EMAIL` et `INITIAL_ADMIN_PASSWORD` dans l’environnement avant le démarrage du serveur. Le mot de passe doit contenir au moins 12 caractères. Le compte est créé uniquement si son adresse courriel n’existe pas déjà. En production, configurez ces valeurs dans les secrets de l’hébergeur; ne réutilisez pas les identifiants de test locaux.

Avec Docker Compose, Mailpit est configuré par défaut comme serveur SMTP de test. Pour utiliser un autre fournisseur, définissez `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_FROM`, `SMTP_USER` et `SMTP_PASSWORD` dans `.env` (ou dans les variables d'environnement de l'hébergeur); gardez les identifiants réels hors du dépôt. Si le courriel ne peut pas être envoyé, la réservation confirmée reste disponible dans « Mes billets » et l'application l'indique au spectateur.

## Préparer l'authentification GitHub

L'application propose la connexion GitHub OAuth sur la page `/connexion`. Copiez `.env.example` vers `.env`, puis renseignez `GITHUB_OAUTH_CLIENT_ID`, `GITHUB_OAUTH_CLIENT_SECRET` et `GITHUB_OAUTH_CALLBACK_URL`.

Créez une **OAuth App** dans les paramètres développeur GitHub. Pour `npm run dev`, utilisez `http://localhost:5173` comme URL d'accueil et `http://localhost:4000/api/auth/github/callback` comme URL de rappel. Avec Docker Compose, l'URL d'accueil et l'origine client sont `http://localhost:3000`; définissez `GITHUB_OAUTH_CALLBACK_URL=http://localhost:3000/api/auth/github/callback` dans `.env`. L'URL de rappel configurée dans GitHub doit correspondre exactement à `GITHUB_OAUTH_CALLBACK_URL`. Une OAuth App GitHub n'acceptant qu'une URL de rappel, modifiez-la selon le mode utilisé.

Au premier accès, l'application demande l'identifiant public, le nom et le courriel GitHub vérifié principal. Une adresse déjà utilisée par un compte Parterre n'est pas liée automatiquement : connectez-vous à ce compte avec son mot de passe. En production, configurez l'origine client et l'URL de rappel sur le domaine HTTPS déployé.
Ne partagez pas et ne commitez jamais `GITHUB_OAUTH_CLIENT_SECRET`. Le fichier `.env` est ignoré par Git; configurez ces valeurs comme secrets d'environnement sur l'hébergeur.

## Comptes de démonstration

Ces deux comptes sont créés automatiquement au démarrage de Docker :

| Rôle | Courriel | Mot de passe |
|---|---|---|
| Gestionnaire | `gestionnaire@parterre.demo` | `demo-gestionnaire-2026` |
| Spectateur | `spectateur@parterre.demo` | `demo-spectateur-2026` |

Ces identifiants sont publics et réservés à la démonstration. Avant tout déploiement, remplacez-les avec les variables `INITIAL_ADMIN_*` et `DEMO_SPECTATOR_*` de `docker-compose.yml`.

## Lancement de développement

Prérequis : Node.js 22 ou plus récent, npm et PostgreSQL. Créez une base `parterre` et copiez `.env.example` en `.env`, puis :

```sh
npm install
npm run dev
```

Le client est servi sur http://localhost:5173 et l’API sur http://localhost:4000. `npm run build` produit le client de production. Au premier démarrage, l’API crée le schéma et quelques séances d’exemple.

## Tests

Les tests d'intégration de l'authentification, du blocage de places et des réservations utilisent une base PostgreSQL séparée de celle de l'application. Prérequis : Node.js 22 ou plus récent, Docker et `npm install`.

```sh
docker run --name pg-test -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=parterre_test -p 5432:5432 -d postgres:16
export TEST_DATABASE_URL=postgres://postgres:postgres@localhost:5432/parterre_test
npm test
```

Sous PowerShell, remplacez la deuxième ligne par `$env:TEST_DATABASE_URL = "postgres://postgres:postgres@localhost:5432/parterre_test"`. Les tests refusent de démarrer si `TEST_DATABASE_URL` n'est pas défini. Ils sont aussi lancés par la CI à chaque poussée. Pour supprimer la base de test : `docker rm -f pg-test`.

Sous PowerShell, dans un nouvel environnement non préconfiguré, le motif `**` de `npm test` n'est pas interprété. Si le port 5432 est déjà utilisé par un PostgreSQL local, publiez le conteneur sur un autre port (ici 5433) et lancez les fichiers de test explicitement, depuis la racine du projet :

```powershell
npm install
docker run --name pg-test -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=parterre_test -p 5433:5432 -d postgres:16
$env:TEST_DATABASE_URL = "postgresql://postgres:postgres@localhost:5433/parterre_test"
node --import tsx --test --test-concurrency=1 server/test/auth.test.ts server/test/blocage.test.ts server/test/reservations.test.ts
```

Si le conteneur `pg-test` existe déjà, remplacez la commande `docker run` par `docker start pg-test`.
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
| `/connexion` | Connexion par courriel ou avec GitHub |
| `/inscription` | Création d’un compte |
| `/seances/:id` | Plan de salle en direct, paiement fictif et confirmation; le gestionnaire y bloque ou débloque une place |
| `/mes-reservations` | Billets à venir et passés, QR code et annulation |
| `/gestion` | Tableau de bord, gestionnaire uniquement |
| `/gestion/seances/nouvelle` | Programmation d’une séance, gestionnaire uniquement |
| `/gestion/validation` | Validation d’un billet à l'entrée (caméra dans Chrome ou Edge, sinon saisie du code), gestionnaire uniquement |

## API REST

| Méthode | Endpoint | Accès |
|---|---|---|
| `POST` | `/api/auth/inscription` | Public |
| `POST` | `/api/auth/connexion` | Public |
| `GET` | `/api/auth/github/status` | Public |
| `GET` | `/api/auth/github` | Public |
| `GET` | `/api/auth/github/callback` | Public |
| `GET` | `/api/auth/me` | Connecté |
| `GET` | `/api/seances` | Public |
| `GET` | `/api/seances/:id/plan` | Public |
| `POST` | `/api/seances/:id/places/:placeId/retenir` | Connecté |
| `POST` | `/api/seances/:id/places/:placeId/bloquer` | Gestionnaire |
| `POST` | `/api/seances/:id/places/:placeId/debloquer` | Gestionnaire |
| `POST` | `/api/reservations` | Connecté |
| `GET` | `/api/reservations` | Connecté |
| `DELETE` | `/api/reservations/:id` | Propriétaire |
| `POST` | `/api/gestion/validation-billet` | Gestionnaire |
| `GET` | `/api/gestion/dashboard` | Gestionnaire |
| `POST` | `/api/seances` | Gestionnaire |

Le client rejoint la salle d’une séance avec `seance:rejoindre` (et la quitte avec `seance:quitter`). Socket.IO diffuse ensuite `place:etat_change` et `place:retenue_expiree` à cette salle, sans authentification et en lecture seule. Les actions de modification restent exclusivement sur l’API REST. Les réservations, rétentions et annulations verrouillent les places concernées dans des transactions PostgreSQL afin d'éviter les conflits simultanés.

La documentation détaillée du projet et les décisions techniques restent disponibles dans `docs/`.

## Ce qui est simulé dans la bêta

| Élément | Ce qui est simulé | Ce qui le remplacera | Sprint |
|---|---|---|---|
| Paiement | Formulaire de carte fictif : le navigateur vérifie seulement le format des champs; rien n'est envoyé au serveur ni conservé, et rien n'est débité | Rien, le paiement réel est hors portée du projet (#21) | — |
| Billet par courriel | Les billets sont envoyés à Mailpit (http://localhost:8025), une boîte de test locale : aucun courriel n'atteint une vraie adresse | Un vrai serveur SMTP, configuré avec les variables `SMTP_*` | À décider |
| Tarif | Le prix est défini par place dans la base de données et le total est calculé selon les sièges choisis | Tarifs réduits et catégories de prix (#15) | 3 |
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