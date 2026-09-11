# Plan des trois sprints

## Sprint 1 — Alpha (~3 semaines)

- **Objectif** : Valider la chaîne complète d'une réservation, du compte utilisateur jusqu'au billet, tout en levant immédiatement les deux risques techniques majeurs (verrouillage pessimiste SQL et diffusion temps réel).
- **Récits prévus** :
- `#1`	Créer un compte et se connecter	Comptes et rôles	5	points
- `#2`	Consulter l'affiche des séances à venir	Programmation	2	points
- `#3`	Créer une séance sur un plan de salle	Programmation	8	points
- `#4`	Voir le plan de salle et l'état des places	Sélection en direct	5 points	
- `#5`	Retenir une place le temps de finaliser	Sélection en direct	8	points
- `#6`	Voir les places changer d'état en direct	Sélection en direct	8	points
- `#7`	Confirmer sa réservation et obtenir son billet	Réservation et billets	3	points
  - **Total : 39 points**
- **Incrément démontrable** : À partir d'un clone neuf avec Docker, deux navigateurs ouverts côte à côte sur la même séance permettent de voir un siège retenu en direct par l'un passer immédiatement en état retenu chez l'autre via Socket.IO. Le verrouillage pessimiste SQL empêche tout conflit de double réservation, et le parcours se termine par la confirmation et l'émission du billet. Chaîne CI verte.

## Sprint 2 — Beta (~3 semaines)

- **Objectif** : Offrir l'autonomie de gestion des billets aux spectateurs, sécuriser l'accès aux fonctions d'administration et outiller le gérant pour la salle.
- **Récits prévus** :
- `#8`	Consulter ses billets à venir et passés	Réservation et billets	2	
- `#9`	Annuler sa réservation avant la séance	Réservation et billets	3	
- `#10`	Bloquer des places pour raison technique ou d'accessibilité	Programmation	3	
- `#11`	Valider un billet à l'entrée de la salle	Exploitation	5	
  - **Total : 13 points**
- **Incrément démontrable** : Un spectateur peut consulter son historique, annuler sa réservation et libérer sa place. Le gérant peut bloquer manuellement des sièges (ex. réservés PMR ou défectueux) et valider ou scanner les billets des spectateurs à l'entrée.

## Sprint 3 — Version finale (~5 semaines)

- **Objectif** : Gérer les imprévus de programmation, le suivi global des salles et intégrer les fonctionnalités à valeur ajoutée (Should) avant le déploiement en ligne.
- **Récits prévus** :
- `#12`	Modifier ou annuler une séance déjà vendue	Programmation	8	
- `#13`	Suivre le remplissage d'une séance en direct	Exploitation	5	
- `#14`	Confier le rôle de gestionnaire à un membre du personnel	Comptes et rôles	3	
  - **Total : 16 points**
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

1. `#20` — Éditeur de plan de salle par glisser-déposer (`could`)
2. `#19` — Suggestion automatique des meilleures places libres (`could`)
3. `#18` — Export CSV des ventes d'une séance (`should`)
4. `#17` — Courriel de confirmation avec le billet (`should`)

Les récits `must` du sprint 1 (#1 à #7) ne sont pas négociables : sans eux, le
cœur du projet — la réservation en temps réel avec gestion des conflits —
n'existe pas.
