# Rétrospective du sprint 2

## Bilan du changement décidé au sprint 1

Le changement proposé était que l'auteur teste son parcours sur une base propre et ajoute ou mette à jour un test avant chaque PR, puis que l'équipe note les tests, les PR vérifiées et les blocages dans le journal à chaque bloc de cours.

- **Appliqué en partie :** le dépôt contient maintenant des tests d'intégration pour l'authentification, les réservations, la concurrence, les courriels, Socket.IO et le blocage des places. La CI construit l'application et lance les tests à chaque push et PR.
- **À améliorer :** le journal ne consigne pas systématiquement, pour chaque bloc de cours, les tests exécutés et les PR vérifiées. Les traces disponibles ne permettent donc pas de confirmer que la vérification sur une base propre a été faite avant chaque PR.

## Les trois questions

### 1. Qu'est-ce qui a bien fonctionné?

Les parcours importants du sprint 2 ont progressé avec des tests automatisés : concurrence lors de la réservation, annulation, envoi ou échec de courriel, diffusion Socket.IO et blocage des places. La CI donne un contrôle commun pour la construction et l'exécution de ces tests.

### 2. Qu'est-ce qui nous a ralentis ou reste à améliorer?

La démonstration de la connexion a été retardée parce que le bouton permettant de la tester n'était pas disponible pendant que la PR correspondante était encore en cours de validation. Il faut prévoir le moment de fusion et de vérification des fonctionnalités nécessaires à la démonstration.

### 3. Quel changement concret adoptons-nous?

Renforcer le rituel de suivi à chaque bloc de cours : tenir une courte réunion au début du bloc pour partager l'avancement et les blocages, puis consigner dans `docs/journal.md` les tests exécutés, les PR vérifiées et les blocages avec leur résolution.

- **Responsable du suivi :** Alexander.
- **Échéance de remise :** chaque membre termine son code et le teste sur sa machine avant la séance de tests en équipe, puis remet sa PR prête à vérifier au début de la séance. La séance est ainsi consacrée aux tests collectifs.
- **Mesure :** vérifier à la prochaine rétrospective que chaque bloc de cours du sprint a une entrée au journal contenant ces éléments.
