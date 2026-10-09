# Organisation de l'équipe

## Rôles

Le rôle de *Scrum Master* tourne à chaque sprint :

| Sprint | Scrum Master |
|---|---|
| 1 | Alexander |
| 2 | Karel |
| 3 | Lina |



## Rituels

- **Mêlée** : au début de chaque bloc de cours (10 minutes, debout). Chaque
  membre indique ce qu'il a terminé, ce qu'il prévoit faire et ce qui le
  bloque. Entre les blocs, un point asynchrone est publié sur Instagram le
  mardi soir.
- **Planification** : au premier bloc de chaque sprint. L'équipe choisit les
  récits selon la capacité et la vélocité mesurée, les découpe en tâches et
  désigne un responsable pour chaque tâche.
- **Revue** : au dernier bloc de chaque sprint. L'incrément est démontré au
  professeur à partir d'un clone neuf ou de l'environnement prévu. La démonstration
  doit inclure les cas d'erreur importants, notamment une tentative de réserver
  une place déjà retenue ou vendue.
- **Rétrospective** : 30 minutes après la revue. L'équipe choisit un seul
  changement concret, le confie à une personne et vérifie son résultat à la
  rétrospective suivante.

## Définition de « terminé »

Un récit est terminé quand :

- le code est fusionné dans `main` par une demande de tirage revue par un
  coéquipier;
- des tests automatisés couvrent le comportement ajouté et ses cas d'erreur;
- tous les critères d'acceptation du récit sont satisfaits;
- l'application démarre à partir d'un clone neuf, avec les services requis
  (notamment PostgreSQL et Socket.IO);
- la documentation utilisateur est à jour si le récit modifie l'interface.

## Conventions

- **Branches** : une branche par récit ou tâche, créée à partir de `main`, avec
  un nom court et descriptif : `feature/recit-05-retention-place`,
  `fix/conflit-reservation` ou `docs/conventions-equipe`. Une branche est
  fusionnée seulement par demande de tirage; on ne pousse pas directement dans
  `main`.
- **Commits** : petits commits cohérents, rédigés à l'impératif en français ou
  en anglais, avec un préfixe explicite : `feat:`, `fix:`, `test:`, `docs:` ou
  `refactor:`. Exemple : `fix: refuser la double retention d une place`.
  Un commit ne mélange pas une fonctionnalité et un nettoyage sans rapport.
- **Revue de code** : toute demande de tirage doit avoir au moins une revue
  d'un coéquipier. La personne qui révise vérifie les critères d'acceptation,
  les tests, les autorisations et les erreurs de concurrence. Les commentaires
  doivent être traités avant la fusion; la vérification CI doit être verte.

## Journal de sprint 0

Le journal est tenu dans [journal.md](journal.md), une entrée par bloc de cours.

## Contributions individuelles


| Membre | Contributions à la soumission |
|---|---|
| Lina | Sprint0 : Récits de l'épique Catalogue ,les issues Sprint1 : Page affiche et base de donnees Sprint2 : Valider un billet à l'entrée de la salle et ajout de formulaire de payment par carte|
| Alexander | **Sprint 0** : conception, maquette de l'écran de recherche.<br>**Sprint 1** : connexion et inscription, récit #1 ([#28](https://github.com/lina48/2026A-420-5D1-Projet-Parterre/pull/28), [#32](https://github.com/lina48/2026A-420-5D1-Projet-Parterre/pull/32)); Docker et intégration continue sur la nouvelle pile, suppression de l'ancien backend ([#33](https://github.com/lina48/2026A-420-5D1-Projet-Parterre/pull/33)); README et liste de ce qui est simulé ([#34](https://github.com/lina48/2026A-420-5D1-Projet-Parterre/pull/34), [#38](https://github.com/lina48/2026A-420-5D1-Projet-Parterre/pull/38)); mentions de démonstration à l'écran ([#39](https://github.com/lina48/2026A-420-5D1-Projet-Parterre/pull/39)); tests d'authentification et CI ([#41](https://github.com/lina48/2026A-420-5D1-Projet-Parterre/pull/41)); comptes de démonstration ([#42](https://github.com/lina48/2026A-420-5D1-Projet-Parterre/pull/42)); route /gestion ([#43](https://github.com/lina48/2026A-420-5D1-Projet-Parterre/pull/43)).<br>**Sprint 2 (prévu)** : récit #10, bloquer des places pour raison technique ou d'accessibilité. |
| Karel | Sprint0 : Rédaction de la vision et les risques Sprint1: Dashboard Sprint2 : Consulter ses billets à venir et passés|
| Hsiao Shan | Sprint0 : Sprints et organisation de l'équipe Sprint1: Reservation des billets Sprint2: Voir les places changer d'état en direct|