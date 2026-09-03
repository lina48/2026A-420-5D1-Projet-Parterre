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
