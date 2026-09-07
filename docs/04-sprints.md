# Plan des trois sprints

## Sprint 1 — Alpha (~3 semaines)

- **Objectif** : Valider la chaîne complète d'une réservation, du compte utilisateur jusqu'au billet, tout en levant immédiatement les deux risques techniques majeurs (verrouillage pessimiste SQL et diffusion temps réel).
- **Récits prévus** :
  - `#1` — Créer un compte et se connecter (5 pts)
  - `#2` — Consulter l'affiche des séances à venir (2 pts)
  - `#3` — Créer une séance sur un plan de salle (8 pts)
  - `#4` — Voir le plan de salle et l'état des places (5 pts)
  - `#5` — Retenir une place le temps de finaliser (8 pts)
  - `#6` — Voir les places changer d'état en direct (8 pts)
  - `#7` — Confirmer sa réservation et obtenir son billet (3 pts)
  - **Total : 34 points**
- **Incrément démontrable** : À partir d'un clone neuf avec Docker, deux navigateurs ouverts côte à côte sur la même séance permettent de voir un siège retenu en direct par l'un passer immédiatement en état retenu chez l'autre via Socket.IO. Le verrouillage pessimiste SQL empêche tout conflit de double réservation, et le parcours se termine par la confirmation et l'émission du billet. Chaîne CI verte.

## Sprint 2 — Beta (~3 semaines)

- **Objectif** : Offrir l'autonomie de gestion des billets aux spectateurs, sécuriser l'accès aux fonctions d'administration et outiller le gérant pour la salle.
- **Récits prévus** :
  - `#8` — Consulter ses billets à venir et passés (2 pts)
  - `#9` — Annuler sa réservation avant la séance (3 pts)
  - `#10` — Bloquer des places pour raison technique ou d'accessibilité (3 pts)
  - `#11` — Valider un billet à l'entrée de la salle (5 pts)
  - **Total : 13 points**
- **Incrément démontrable** : Un spectateur peut consulter son historique, annuler sa réservation et libérer sa place. Le gérant peut bloquer manuellement des sièges (ex. réservés PMR ou défectueux) et valider ou scanner les billets des spectateurs à l'entrée.

## Sprint 3 — Version finale (~5 semaines)

- **Objectif** : Gérer les imprévus de programmation, le suivi global des salles et intégrer les fonctionnalités à valeur ajoutée (Should) avant le déploiement en ligne.
- **Récits prévus** :
  - `#12` — Modifier ou annuler une séance déjà vendue (8 pts)
  - `#13` — Suivre le remplissage d'une séance en direct (5 pts)
  - `#14` — Confier le rôle de gestionnaire à un membre du personnel (3 pts)
  - `#15` — Tarifs réduits et catégories de prix [Should] (3 pts)
  - `#16` — Filtrer l'affiche par ville, date et genre [Should] (2 pts)
  - `#17` — Courriel de confirmation avec le billet [Should] (2 pts)
  - `#18` — Export CSV des ventes d'une séance [Should] (2 pts)
  - **Total : 25 points**
- **Incrément démontrable** : Application complète déployée en ligne. Le gérant modifie une séance existante, suit le taux d'occupation en temps réel, délègue le rôle gérant, et exporte les rapports de ventes au format CSV.

## Capacité

| Élément | Calcul |
|---|---|
| Blocs de cours dans le sprint 1 | 6 blocs × 3 h = 18 h |
| Travail personnel | 3 h/semaine × 3 semaines = 9 h |
| Total par personne | 27 h |
| Équipe de 3 | 81 heures-personne |
| Moins rituels, coordination, revues (~20 %) | ≈ **65 h de développement** |

Nous ne connaissons pas encore notre vélocité. Premier réflexe : viser environ
20 points; après correction du biais d'optimisme (−30 %, comme le recommandent
les notes de cours), nous nous engageons sur **15 points** au sprint 1 et nous
ajusterons les sprints 2 et 3 sur la vélocité mesurée.

## Ordre d'abandon

Si nous prenons du retard, nous coupons dans cet ordre :

1. #13 — Joindre une photo de pochette (`could`);
2. #11 — Statistiques par décennie (`could`);
3. #10 — Faire correspondre les colonnes d'un CSV (`could`) : l'import reste
   alors limité au format documenté.

La recherche (#3) et l'import d'un CSV bien formé (#7) ne sont pas
négociables : sans eux, Sillon ne vaut pas mieux qu'une feuille Excel.