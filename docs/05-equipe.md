# Organisation de l'équipe

## Rôles

Le rôle de *Scrum Master* tourne à chaque sprint :

| Sprint | Scrum Master |
|---|---|
| 1 | Lina |
| 2 | Alexander |
| 3 | Karel |


## Rituels

- **Mêlée** : au début de chaque bloc de cours (10 min, debout); entre les
  blocs, un point asynchrone sur Instagram le mardi soir.
- **Planification** : premier bloc de chaque sprint.
- **Revue** : dernier bloc de chaque sprint, incrément démontré au professeur.
- **Rétrospective** : 30 minutes après la revue; on en sort avec un
  changement précis, assigné à quelqu'un, vérifié à la rétrospective suivante

## Définition de « terminé »

Un récit est terminé quand :

- le code est fusionné dans `main` par une demande de tirage revue par un
  coéquipier;
- l'intégration continue est verte;
- des tests automatisés couvrent le comportement ajouté, cas d'erreur inclus;
- tous les critères d'acceptation du récit sont satisfaits;
- l'application démarre à partir d'un clone neuf;
- la documentation utilisateur est à jour si le récit change l'interface.

## Conventions

- **Branches** : `<numéro-du-ticket>-<description-courte>`, ex. `3-recherche-artiste-titre`.
- **Commits** : impératif présent, première ligne ≤ 72 caractères; la demande
  de tirage qui termine un récit le référence (`Closes #3`).
- **Revue de code** : au moins une approbation avant fusion; on relit les
  demandes de tirage en attente au début de chaque bloc, avant d'écrire du
  code.

## Journal de sprint 0

Le journal est tenu dans [journal.md](journal.md), une entrée par bloc de cours.

## Contributions individuelles

> [!NOTE]
> Une ligne d'exemple; votre tableau couvre chaque membre, avec des liens vers
> les tickets et les commits.

| Membre | Contributions à la soumission |
|---|---|
| Lina | Récits de l'épique Catalogue ,les issues |
| Alexander | Conception , maquette de l'écran de recherche |
| Karel | Rédaction de la vision (`01-vision.md`) et les risques|
| Hsiao Shan | Sprints et organisation de l'équipe |