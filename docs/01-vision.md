# Vision du projet

## 1. Problème

La réservation de places pour une séance de cinéma ou de théâtre se fait encore souvent au guichet, par téléphone ou avec des systèmes qui ne montrent pas clairement la disponibilité des sièges en temps réel.

Cela peut créer plusieurs problèmes : un client peut choisir un siège qui vient d'être réservé par une autre personne, deux utilisateurs peuvent essayer de réserver le même siège en même temps, ou une salle peut sembler complète alors que des places viennent d'être libérées.

Notre projet vise donc à offrir un système simple permettant de consulter les séances et de voir immédiatement quels sièges sont disponibles.

## 2. Personnes utilisatrices

### Spectateur

Le spectateur est la personne qui souhaite assister à une séance.

Il peut :
- consulter les films ou pièces à l'affiche;
- consulter les différentes séances et leurs horaires;
- voir la carte des sièges et leur disponibilité;
- sélectionner et réserver un ou plusieurs sièges;
- annuler une réservation.

Son objectif principal est de pouvoir réserver rapidement une place disponible sans risque de conflit avec un autre utilisateur.

### Gérant de la salle

Le gérant est responsable de l'organisation des salles et des séances.

Il peut :
- gérer les films ou pièces présentés;
- créer et gérer les séances;
- gérer les salles et leurs plans de sièges;
- consulter le niveau d'occupation des séances.

Son objectif principal est de gérer efficacement les séances et de suivre l'occupation des salles.

## 3. Portée du projet

Le système doit offrir les six fonctionnalités principales suivantes :

1. Consultation des séances : affichage des films ou pièces disponibles ainsi que leurs horaires.
2. Carte de sièges en temps réel : affichage des sièges disponibles, réservés ou occupés.
3. Réservation de sièges avec gestion des conflits de concurrence.
4. Annulation d'une réservation.
5. Gestion des séances et des salles par le gérant.
6. Tableau de bord permettant au gérant de consulter l'occupation des séances.

## 4. Fonctionnalité en temps réel

La fonctionnalité principale en temps réel concerne la carte des sièges.

Lorsqu'un utilisateur réserve ou libère un siège, la carte doit être mise à jour chez les autres utilisateurs qui consultent la même séance.

Par exemple, si deux spectateurs consultent le siège A10 et que le premier le réserve, le deuxième doit voir rapidement que le siège A10 n'est plus disponible.

Le système doit également empêcher que deux réservations soient confirmées pour le même siège et la même séance.

## 5. Objectif

L'objectif du projet est de rendre la réservation de sièges plus simple, claire et fiable pour les spectateurs tout en fournissant au gérant les outils nécessaires pour gérer les séances, les salles et leur occupation.

## 6. Respect des exigences techniques

| # | Exigence | Technologie retenue | Comment le projet la satisfait |
|---|---|---|---|
| 1 | Cadriciel full stack, rendu serveur + client | Node.js + React (React Router v7 en mode framework) | Les routes comme `/seances/:id` sont rendues côté serveur au premier chargement, puis la navigation devient côté client |
| 2 | Base de données transactionnelle, écritures simultanées | PostgreSQL | Transactions ACID; `SELECT ... FOR UPDATE` garantit qu'une écriture concurrente sur `PLACE_SEANCE` reste correcte (voir D1 dans `03-conception.md`) |
| 3 | Installation/démarrage via Docker | Docker + Docker Compose | L'application démarre à partir d'un clone neuf, sans dépendance à installer sur la machine du correcteur |
| 4 | Au moins deux rôles avec permissions différentes | Authentification par compte, rôle `spectateur` / `gestionnaire` sur `UTILISATEUR` | Ex. `POST /api/seances` est réservé au gestionnaire |
| 5 | Fonctionnalité temps réel multi-utilisateurs | Socket.IO | Le client rejoint une *room* Socket.IO propre à chaque séance (`/seances/:id`). Dès qu'une place change d'état, le serveur émet `place:etat_change` à toute la room — la carte se met à jour sans rechargement. `place:retenue_expiree` libère automatiquement une place dont la rétention expire. Le client n'émet jamais d'événement lui-même : les actions passent par l'API REST, Socket.IO ne sert qu'à diffuser |
| 6 | Point de concurrence réel | Verrouillage pessimiste PostgreSQL | Deux spectateurs peuvent viser la même place au même instant. Le projet verrouille la ligne `PLACE_SEANCE` en base (`SELECT ... FOR UPDATE`) le temps de la transaction de rétention/confirmation — une seule transaction SQL garantit qu'une place n'est jamais retenue ou vendue deux fois. En cas de forte affluence sur une même place, les utilisateurs attendent en file plutôt qu'en parallèle |
| 7 | Tests automatisés à chaque poussée | GitHub Actions | Chaîne CI exécutée à chaque push, verte avant chaque revue de sprint |
| 8 | Déployé sur un serveur | À déterminer selon les modalités précisées en cours de session | Accessible autrement que depuis nos portables |
