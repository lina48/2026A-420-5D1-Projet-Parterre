# Plan des trois sprints

## Sprint 1 : Alpha (environ 3 semaines)

**Objectif.** Valider la chaîne complète d'une réservation, du compte utilisateur jusqu'au billet, tout en levant immédiatement les deux risques techniques majeurs : le verrouillage pessimiste SQL et la diffusion temps réel.

| # | Récit | Épique | Points |
|---|---|---|---|
| #1 | Créer un compte et se connecter | Comptes et rôles | 5 |
| #2 | Consulter l'affiche des séances à venir | Programmation | 3 |
| #3 | Créer une séance sur un plan de salle | Programmation | 8 |
| #4 | Voir le plan de salle et l'état des places | Sélection en direct | 5 |
| #5 | Retenir une place le temps de finaliser | Sélection en direct | 8 |
| #6 | Confirmer sa réservation et obtenir son billet | Réservation et billets | 5 |
| | **Total** | | **34** |

**Incrément démontrable.** À partir d'un clone neuf avec Docker, deux navigateurs ouverts côte à côte sur la même séance permettent de voir un siège retenu par l'un passer immédiatement en état retenu chez l'autre via Socket.IO. Le verrouillage pessimiste SQL empêche tout conflit de double réservation, et le parcours se termine par la confirmation et l'émission du billet. Chaîne CI verte.

## Sprint 2 : Beta (environ 3 semaines)

**Objectif.** Offrir l'autonomie de gestion des billets aux spectateurs, sécuriser l'accès aux fonctions d'administration et outiller le gérant pour la salle.

| # | Récit | Épique | Points |
|---|---|---|---|
| #6 | Voir les places changer d'état en direct | Sélection en direct | 8 |
| #8 | Consulter ses billets à venir et passés | Réservation et billets | 2 |
| #9 | Annuler sa réservation avant la séance | Réservation et billets | 3 |
| #10 | Bloquer des places pour raison technique ou d'accessibilité | Programmation | 3 |
| #11 | Valider un billet à l'entrée de la salle | Exploitation | 5 |
| | **Total** | | **13** |

**Incrément démontrable.** Un spectateur peut consulter son historique, annuler sa réservation et libérer sa place. Le gérant peut bloquer manuellement des sièges, par exemple réservés PMR ou défectueux, et valider les billets des spectateurs à l'entrée.

## Sprint 3 : Version finale (environ 5 semaines)

**Objectif.** Gérer les imprévus de programmation, le suivi global des salles et intégrer les fonctionnalités à valeur ajoutée avant le déploiement en ligne.

| # | Récit | Épique | Points |
|---|---|---|---|
| #12 | Modifier ou annuler une séance déjà vendue | Programmation | 8 |
| #13 | Suivre le remplissage d'une séance en direct | Exploitation | 5 |
| #14 | Confier le rôle de gestionnaire à un membre du personnel | Comptes et rôles | 3 |
| | **Total** | | **16** |

**Incrément démontrable.** Application complète déployée en ligne. Le gérant modifie une séance existante, suit le taux d'occupation en temps réel, délègue le rôle de gestionnaire .

## Capacité

| Élément | Sprint 1 | Sprint 2 | Sprint 3 |
|---|---|---|---|
| Durée | 3 semaines | 3 semaines | 5 semaines |
| Blocs de cours | 6 × 3 h = 18 h | 6 × 3 h = 18 h | 10 × 3 h = 30 h |
| Travail personnel (3 h/semaine) | 9 h | 9 h | 15 h |
| Total par personne | 27 h | 27 h | 45 h |
| Équipe de 4 | 108 h-personne | 108 h-personne | 180 h-personne |
| Moins rituels, coordination, revues (20 %) | **86 h** | **86 h** | **144 h** |

Nous ne connaissons pas encore notre vélocité. Les 86 heures de développement du sprint 1 rapportées aux 34 points engagés impliquent une productivité d'environ 2,2 heures par point, ce que nous considérons comme optimiste pour un premier sprint sur une pile que l'équipe découvre. Après application du correctif de prudence de 30 % recommandé dans les notes de cours, notre capacité réaliste se situe plutôt autour de **21 points**. Nous conservons néanmoins les 34 points au sprint 1, parce que les récits #3 à #6 forment un bloc indissociable : livrer la rétention sans la diffusion temps réel ne démontre rien. Nous absorbons l'écart par l'ordre d'abandon ci dessous plutôt qu'en repoussant le risque technique au sprint 2. La vélocité réellement mesurée au sprint 1 servira à réviser les engagements des sprints suivants.

## Ordre d'abandon

Si la capacité se révèle insuffisante, nous retirons les récits dans cet ordre, du premier sacrifié au dernier.

| Sprint | Ordre | Justification |
|---|---|---|
| 1 | #2, puis #1 | L'affiche peut être remplacée par un lien direct vers une séance de démonstration. L'authentification peut être réduite à une session simulée à deux comptes fixes. Les deux sont rattrapables au sprint 2 sans rien casser. |
| 1 | Jamais : #3, #4, #5, #6, #7 | Ce sont les récits porteurs de risque et la chaîne minimale qui prouve que le produit fonctionne. |
| 2 | #17, puis #16 | Ce sont des `should`, ajoutés pour lisser la charge. Ils sortent avant tout `must`. |
| 3 | #18, puis #15 | Mêmes raisons. Le déploiement en ligne et #12 restent prioritaires. |