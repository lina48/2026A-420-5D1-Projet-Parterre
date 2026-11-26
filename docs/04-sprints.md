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
| #7 | Confirmer sa réservation et obtenir son billet | Réservation et billets | 5 |
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
| #16 | Filtrer l'affiche par salle, date et genre | Programmation | 3 |
| #17 | Courriel de confirmation avec le billet | Réservation et billets | 3 |
| | **Total** | | **27** |

**Incrément démontrable.** Un spectateur peut consulter son historique, annuler sa réservation et libérer sa place. Le gérant peut bloquer manuellement des sièges, par exemple réservés PMR ou défectueux, et valider les billets des spectateurs à l'entrée.

## Sprint 3 : Version finale (environ 5 semaines)

**Objectif.** Livrer une version déployable et exploitable de Parterre, avec des données de programmation persistantes et des outils utiles au gestionnaire et au spectateur. Prioriser les travaux selon les estimations et la capacité mesurée plutôt que de promettre tout le périmètre.

| # | Récit | Épique | Points | Responsable |
|---|---|---|---|---|
| #12 | Modifier ou annuler une séance déjà vendue | Programmation | 8 | Karel |
| #13 | Suivre le remplissage d'une séance en direct | Exploitation | 5 | Lina |
| #15 | Choisir un tarif réduit, par exemple étudiant | Réservation et billets | 5 | Lina |
| #18 | Exporter en CSV les places vendues d'une séance | Exploitation | 3 | Karel |
| #16 | Compléter les filtres par salle et date; le filtre par genre existe déjà | Programmation | À réestimer | Lina |
| #69 | Préparer des données réelles et conserver les données dans Docker | Données et déploiement | À estimer | Alexander |
| #20 | Dessiner un plan de salle au glisser-déposer | Programmation | À estimer | Hsiao Shan |
| #70 | Assister le spectateur après une période d'inactivité | Sélection en direct | À estimer | À confirmer |
| #71 | Rendre les séances découvrables par les IA et déployer sur Azure | Données et déploiement | À estimer | Alexander |
| #19 | Proposer les meilleures places libres pour un groupe | Sélection en direct | À estimer | Hsiao Shan |
| | **Sous-total des récits déjà estimés** | | **24** | |

Les 24 points couvrent les récits #12, #13, #14, #15 et #18. Les six récits #16, #19, #20, #69, #70 et #71 restent à estimer; le total du sprint et sa faisabilité ne sont donc pas encore établis. Le responsable de #70 reste à confirmer par l'équipe. #16 était prévu au sprint 2, mais seul le filtre par genre était réalisé lors du bilan; son complément par salle et date est repris ici.

### Détails des travaux prévus

- **#18 — Export des ventes.** Le gestionnaire exporte les places vendues d'une séance en CSV, lisible dans Excel ou LibreOffice. Chaque ligne contient la séance, le numéro de place, la référence de commande et le prix payé. Définir les règles pour les réservations annulées et les remboursements.
- **#12 — Modification ou annulation d'une séance vendue.** Le gestionnaire peut modifier ou annuler une séance ayant déjà des réservations. Préciser avant réalisation le traitement des billets, des spectateurs concernés et des éventuels remboursements.
- **#13 — Remplissage en direct.** Le gestionnaire voit les places vendues, la capacité et le pourcentage de remplissage; les changements sont actualisés sans recharger la page en réutilisant le canal temps réel de #6. Définir le traitement des places bloquées, retenues et annulées.
- **#15 — Tarif réduit.** Le spectateur peut choisir un tarif réduit, notamment étudiant, avec la saisie éventuelle d'un code permanent. Définir les critères d'admissibilité, la méthode de vérification et la protection des données avant de retenir cette méthode.
- **#16 — Filtres.** Compléter la recherche par salle de cinéma ou de théâtre et par date, en conservant le filtre par genre existant.
- **#69 — Données réelles et volume Docker.** Préparer des films, salles et séances réels à partir de sources autorisées, puis conserver les données dans le volume PostgreSQL de Docker entre les redémarrages. Prévoir une méthode de mise à jour qui ne remplace pas les réservations existantes; la suppression du volume reste destructive.
- **#20 — Éditeur de salle.** Permettre au gestionnaire de dessiner un plan de salle par glisser-déposer, de l'enregistrer et de le réutiliser. Définir les règles de validation et l'effet des modifications sur les séances déjà vendues.
- **#70 — Assistance sur hésitation.** Après cinq minutes d'inactivité, proposer à l'utilisateur une notification dans l'application pour vérifier s'il est toujours actif et suggérer des séances à venir. Préciser quelles actions réinitialisent le minuteur et comment éviter les notifications répétées.
- **#71 — Visibilité pour l'IA et Azure.** Prévoir des données structurées JSON-LD pour les pages publiques de séances et une description ouverte de l'API des séances, puis héberger le site sur Azure. La découverte et l'indexation par les moteurs ou les IA ne sont pas garanties; préciser l'environnement, les secrets et la base de données du déploiement.
- **#19 — Meilleures places pour un groupe.** Proposer à un groupe de taille donnée des places libres à l'aide d'un algorithme de placement. Définir les critères de classement, notamment la proximité des places, et le comportement lorsqu'il n'y a pas assez de places adjacentes; la disponibilité doit être vérifiée au moment de la réservation.

**Incrément visé.** Application déployée sur Azure avec des séances découvrables et des données persistantes. Le gestionnaire modifie une séance vendue, suit son remplissage en direct et exporte ses ventes; le spectateur filtre les séances, choisit un tarif réduit et peut recevoir des suggestions. L'éditeur de salle et la proposition de places de groupe complètent la démonstration s'ils sont réalisés.

## Capacité

| Élément | Sprint 1 | Sprint 2 | Sprint 3 |
|---|---|---|---|
| Durée | 3 semaines | 3 semaines | 5 semaines |
| Blocs de cours | 6 × 3 h = 18 h | 6 × 3 h = 18 h | 10 × 3 h = 30 h |
| Travail personnel (3 h/semaine) | 9 h | 9 h | 15 h |
| Total par personne | 27 h | 27 h | 45 h |
| Équipe de 4 | 108 h-personne | 108 h-personne | 180 h-personne |
| Moins rituels, coordination, revues (20 %) | **86 h** | **86 h** | **144 h** |

La vélocité mesurée était de 5 points au sprint 1 et de 17 points au sprint 2. En utilisant à titre indicatif les 17 points livrés pour les 86 heures de capacité du sprint 2, les 144 heures prévues au sprint 3 correspondent à environ **28 points** (17 × 144 ÷ 86). Cette projection repose sur un seul sprint de référence et n'est pas une garantie. Le sprint 3 compte actuellement 24 points estimés et six récits non estimés; il reste donc environ 4 points de marge indicative avant estimation de ces récits. L'équipe doit estimer les travaux manquants et ajuster son engagement et son ordre d'abandon avant de considérer le plan comme faisable.

## Ordre d'abandon

Si la capacité se révèle insuffisante, nous retirons les récits dans cet ordre, du premier sacrifié au dernier.

| Sprint | Ordre | Justification |
|---|---|---|
| 1 | #2, puis #1 | L'affiche peut être remplacée par un lien direct vers une séance de démonstration. L'authentification peut être réduite à une session simulée à deux comptes fixes. Les deux sont rattrapables au sprint 2 sans rien casser. |
| 1 | Jamais : #3, #4, #5, #6, #7 | Ce sont les récits porteurs de risque et la chaîne minimale qui prouve que le produit fonctionne. |
| 2 | #17, puis #16 | Ce sont des `should`, ajoutés pour lisser la charge. Ils sortent avant tout `must`. |
| 3 | #20 et #19 d'abord, puis les autres ajouts selon leur priorité à raffiner; #18 et #15 avant les `must` | La charge ajoutée reste à estimer. Le déploiement en ligne et #12 restent prioritaires; l'équipe révisera l'engagement selon sa capacité. |

### Bilan du sprint 1

- **Points engagés** : 34 (#1, #2, #3, #4, #5, #7). Le journal du 10 septembre mentionnait 15 points; le plan retenu et le tableau ci-dessus sont à 34.
- **Points livrés** : 5 (#1). Selon notre définition de « terminé » (`05-equipe.md`), un récit sans tests automatisés n'est pas terminé; seule l'authentification en a (7 tests). Un récit à moitié fini ne compte pas.
- **Vélocité mesurée** : 5 points. Les récits #2, #3, #4, #5 et #7 fonctionnent en grande partie à la démonstration, mais n'ont pas de tests; à la revue, le dashboard (#3, corrigé depuis) et la retenue du premier siège libre (#5) avaient aussi des défauts.
- **Points abandonnés** : 0. Aucun récit n'a été enlevé du plan. Les récits 2, 3, 4, 5 et 7 sont incomplets et pas abandonnés.
- **Reporté au sprint 2** : tests de #2, #3, #4, #5 et #7; verrou `SELECT … FOR UPDATE` dans une transaction, avec un test de deux requêtes simultanées; correction du premier siège libre. Le plan du sprint 2 (19 points) sera révisé à partir de cette vélocité.

### Planification du sprint 2

*Section rédigée le 29 octobre, à la fin du sprint : le plan n'a pas été révisé au début du sprint, comme le bilan du sprint 1 le prévoyait.*

- **Objectif** : offrir l'autonomie de gestion des billets aux spectateurs, sécuriser l'accès aux fonctions d'administration et outiller le gérant pour la salle.
- **Engagement** : 27 points (#6, #8, #9, #10, #11, #16, #17). Le tableau du sprint 2 affichait un total de 19, mais la somme de ses récits est 27; le total est corrigé.
- **Écart avec la vélocité** : la vélocité mesurée au sprint 1 était de 5 points, très loin de 27. Nous n'avons pas recalculé l'engagement à partir de ce chiffre : c'est une erreur de planification, pas un choix justifié.
- **Responsables** : voir le tableau ci-dessous. #16 et #17 n'avaient pas de responsable désigné au départ.

| Récit | Responsable prévu (`02-backlog.md`) | Réalisé par (historique Git) |
|---|---|---|
| #6 Voir les places changer d'état en direct | Lina | Lina (diffusion, tests), Hsiao Shan (affichage) |
| #8 Consulter ses billets à venir et passés | Hsiao Shan | Karel |
| #9 Annuler sa réservation avant la séance | Lina | Lina |
| #10 Bloquer des places | Alexander | Alexander |
| #11 Valider un billet à l'entrée | Karel | Hsiao Shan |
| #16 Filtrer l'affiche | — | Personne (seul le filtre par genre existe) |
| #17 Courriel de confirmation | — | Lina |

### Bilan du sprint 2

*État au 29 octobre, 23 h; mis à jour si des tests sont fusionnés avant la remise.*

- **Points engagés** : 27 (#6, #8, #9, #10, #11, #16, #17).
- **Points livrés** : 17 — #6 (8), #9 (3), #10 (3) et #17 (3), fusionnés avec des tests automatisés (`reservations.test.ts` pour #6, #9 et #17; `blocage.test.ts` pour #10). Selon notre définition de « terminé » (`05-equipe.md`), un récit sans test n'est pas terminé et ne compte pas.
- **Vélocité mesurée** : 17 points (5 au sprint 1).
- **Points abandonnés ou non terminés** : 10. #11 (5) est arrivé directement sur `main` le 29 octobre à 19 h 21, sans PR, sans revue ni test automatisé. #8 (2) est fusionné (#54) mais sans test. #16 (3) est abandonné : seul le filtre par genre existe, ceux par ville et par date n'ont pas été faits.
- **Ordre d'abandon** : il prévoyait #17, puis #16. #17 a été livré avec #51 et #16 a été abandonné, mais #8 et #11, des `must`, ne sont pas terminés : l'écart n'est pas le résultat d'un arbitrage.
- **Reporté au sprint 3** : tests de #11 et de #8; protection de la branche `main`; revue obligatoire avant fusion.