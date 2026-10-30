# Rétrospective du sprint 2

## Bilan du changement décidé au sprint 1

Le changement proposé était que l'auteur teste son parcours sur une base propre et ajoute ou mette à jour un test avant chaque PR, puis que l'équipe note les tests, les PR vérifiées et les blocages dans le journal à chaque bloc de cours.

- **Appliqué en partie :** des tests ont été ajoutés dans les PR #50, #51 et #52. Les PR #53, #54 et #61 ont été fusionnées sans ajout de tests.
- **Suivi :** la mesure choisie au sprint 1 était déjà de noter les tests exécutés, les PR vérifiées et les blocages dans `docs/journal.md`. Le journal documente notamment les changements et les blocages des séances.
- **Fusions :** les PR #50, #52, #53 et #54 ont été fusionnées le lundi 26 octobre. La PR #51 a été fusionnée le jeudi 29 octobre à 9 h 10, et la PR #61 le jeudi 29 octobre à 22 h 39 (heure locale).
- **CI :** les vérifications GitHub Actions ont réussi pour ces PR; « sans test » signifie qu'aucun nouveau test n'a été ajouté dans la PR.

## Les trois questions

### 1. Qu'est-ce qui a bien fonctionné?

Les parcours importants du sprint 2 ont progressé avec des tests automatisés : concurrence lors de la réservation, annulation, envoi ou échec de courriel, diffusion Socket.IO et blocage des places. La CI donne un contrôle commun pour la construction et l'exécution de ces tests.

### 2. Qu'est-ce qui nous a ralentis ou reste à améliorer?

La démonstration de la connexion a été retardée parce que le bouton permettant de la tester n'était pas disponible pendant que la PR correspondante était encore en cours de validation. Il faut prévoir le moment de fusion et de vérification des fonctionnalités nécessaires à la démonstration.

### 3. Quel changement concret adoptons-nous?

Protéger la branche `main` : toute modification doit passer par une PR, la CI doit être verte et au moins une personne doit approuver la PR avant sa fusion. Les modifications directes de `main` seront ainsi bloquées.

- **Responsable :** l'équipe, avec la personne qui administre le dépôt chargée de configurer la règle GitHub.
- **Mesure :** vérifier que chaque fusion dans `main` provient d'une PR approuvée et dont les vérifications CI sont réussies.
