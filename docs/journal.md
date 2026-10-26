# Journal de bord

Journal tenu par l'équipe, une entrée par bloc de cours, rédigée à la fin du bloc.

---

## 24 août 2026

- **Présences** : Alexander, Hsiao Shan
- **Avancement** : Formation de l'équipe (Lina, Alexander, Karel, Hsiao Shan). Piste principale retenue : réservation de locaux d'étude au cégep, avec 1-2 idées de secours explorées (covoiturage entre étudiants, tournois amateurs, troc de matériel).
- **Blocage** : Aucun noté.
- **Décisions** : Réservation de locaux choisie comme piste à présenter au point de contrôle du 27 août, avec pistes de secours en renfort.

---

## 27 août 2026

- **Présences** : Alexander, Karel, Hsiao Shan
- **Avancement** : Présentation de l'idée « réservation de locaux » au point de contrôle 1. Le professeur juge la direction pas assez poussée techniquement (trop proche d'un CRUD simple) et oriente l'équipe vers un projet avec un enjeu de concurrence plus fort — d'où le choix du projet de réservation de sièges de cinéma/théâtre.
- **Blocage** : L'idée initiale (réservation de locaux) manquait de logique métier et de véritable point de concurrence aux yeux du professeur.
- **Décisions** : Pivot vers le projet de réservation de sièges de cinéma/théâtre, sur suggestion du professeur.

---

## 31 août 2026

- **Présences** : Lina
- **Avancement** : Structure initiale du projet posée (Lina). Ébauche du backlog avec ses catégories `should` / `could` / `won't`.
- **Blocage** : Aucun noté.
- **Décisions** : Le backlog est organisé selon la méthode MoSCoW (must/should/could/won't) pour distinguer dès le départ ce qui est négociable du cœur du projet.

---

## 3 septembre 2026

- **Présences** : Alexander, Karel, Hsiao Shan, Lina
- **Avancement** : Depuis le dernier bloc — première version de `03-conception.md` rédigée par Alexander (modèle de données avec l'entité pivot `PLACE_SEANCE`, routes principales, événements Socket.IO); rédaction de `01-vision.md` et `06-risques.md` par Karel; clarification des épiques du backlog par Lina.
- **Blocage** : Aucun noté.
- **Décisions** :
  - Verrouillage pessimiste (`SELECT ... FOR UPDATE`) choisi pour empêcher la double réservation d'une place (D1).
  - PostgreSQL retenu comme base de données : support natif du verrouillage de ligne, cohérent avec D1 (D2).
  - Socket.IO retenu pour le temps réel : le concept de *room* correspond directement au besoin de diffuser les changements par séance (D3).
  - Les 5 risques principaux du projet sont identifiés, avec un accent sur la réservation simultanée (risque 1) et la difficulté technique du temps réel (risque 3), cohérent avec D1 et D3.

---

## 10 septembre 2026

- **Présences** : Alexander
- **Avancement** : Depuis le dernier bloc — rédaction de `04-sprints.md` (objectifs et capacité des 3 sprints, récits détaillés, ordre d'abandon) et finalisation de `05-equipe.md` (rituels, définition de « terminé », conventions de branches et de commits) par Hsiao Shan. Rédaction du journal de bord et finalisation de la soumission.
- **Blocage** : Aucun noté.
- **Décisions** : Engagement du sprint 1 fixé à 15 points, après correction du biais d'optimisme (-30 % sur une première estimation de 20 points). Rôle de Scrum Master fixé en rotation — Alexander au sprint 1,  Karel au sprint 2, Lina au sprint 3.

--- 

## 17 septembre 2026

- **Présences** : Alexander, Lina, Hsiao Shan, Karel
- **Avancement** : 
- **Blocage** : Aucun noté.
- **Décisions** : 



## 21 septembre 2026

- **Présences** : Lina, Alexander, Karel, Hsiao Shan
- **Avancement** : Mêlée de 10 minutes sur l’état du projet. Chaque membre a fait le point sur ses tâches et sur les récits qu’il doit mener. La base de données a été revue et les règles d’intégrité ont été renforcées. Création du dashboard et de la création de séance.
- **Blocage** : Incohérence de la conception de la base de données, notamment sur l’unicité des places par séance, les tables de jointure de réservation, la cohérence salle/place/séance et la gestion de l’annulation sans perdre une place définitivement.
- **Décisions** :
  - Correction de la table `place_seance` avec `UNIQUE (place_id, seance_id)` pour éviter les doublons.
  - Correction de `reservation_place` avec une clé composite et un index unique partiel `WHERE active` pour permettre l’annulation sans bloquer définitivement la place.
  - Ajout de la cohérence salle/place/séance via les clés composites et les contraintes de relation.
  - Vérification stricte du statut de retenue avec `CHECK` pour empêcher les états incohérents.
  - Revue de la structure finale de la base avec PostgreSQL pour aligner le design avec les exigences de concurrence, d’annulation et de temps réel.
    
## 28 septembre 2026

- **Présences** : Lina, Alexander, Karel, Hsiao Shan
- **Avancement** : la migration vers le nouveau stack React/TypeScript et Express, à la séparation des pages et services, à la page de programmation et au nettoyage de l’ancienne structure. Ces changements soutiennent les récits de consultation, création et réservation (#2, #3, #4, #5 et #7), et aussi lier les pages de connexion avec le plan des salles
- 
- **Blocage** : L’ancienne structure séparait le backend et les pages statiques d’authentification du nouveau stack.
- **Décision** : Regrouper le fonctionnement autour du stack utilisé par l’application afin que les pages et l’API travaillent avec la même base et le même serveur.

- **Avancement (Alexander)** : récit #1 (inscription et connexion) sur l'ancienne structure, PR #28 fusionnée. Lina a restructuré la pile le même jour (React, TypeScript, Vite, Express).
- **Blocage (Alexander)** : le backend du récit #1 doit être refait sur la nouvelle structure.
- **Décision (Alexander)** : `bcryptjs` plutôt que `bcrypt`, pour éviter les problèmes de compilation dans l'image Alpine.


## 1er octobre 2026

- **Présences** : Lina
- **Avancement** : relier la connexion à l’application, ajouté l’accès à la connexion depuis l’accueil, traité le cas d’un utilisateur non connecté qui choisit une place et rendu le seed des séances de démonstration relançable lorsque les séances existantes sont passées (#1, #2; accès gestionnaire associé à #3). Gérer les merge conflicts pour le dashboard et createsession.
- **Blocage** : Les séances de démonstration pouvaient rester dans la base persistante tout en étant toutes passées, laissant l’accueil sans séance.
- **Décision** : Recréer une programmation de démonstration lorsqu’il ne reste aucune séance ouverte à venir, sans effacer les comptes, réservations ni anciennes séances.

- **Avancement (Alexander)** : récit #1 refait sur la nouvelle structure (PR #32); Docker et CI sur la nouvelle pile, ancien backend supprimé (PR #33); correction du README (PR #34). Le 1er octobre : 7 tests d'intégration de l'authentification avec `node:test`, la CI lance maintenant `npm test` (PR #41); section « Ce qui est simulé » du README (PR #38); mentions « simulé » à l'écran (PR #39); comptes de démonstration (PR #42); route `/gestion` qui manquait dans `App.tsx` (PR #43). Comme Scrum Master, j'ai trouvé la cause de la CI rouge de la PR #35 de Karel (erreur de syntaxe dans une requête SQL de `server/index.ts`); il l'a corrigée lui-même.
- **Blocage (Alexander)** : la concurrence (D1) n'est pas implémentée : pas de `FOR UPDATE` sur « retenir » et « réserver » (#5, #7), et aucun test sur ces récits. La route `/gestion` manquait, ce qui menait à une page 404 après la création d'une séance.
- **Décisions (Alexander)** :
  - Règle pour la PR #35 : description, CI verte et approbation avant 22 h, sinon reportée au sprint 2.
  - Les tests lancent `server/index.ts` comme un vrai processus sur un port libre, au lieu de séparer `app.ts`, parce que la PR #35 modifiait déjà ce fichier. C'est moins fidèle au cours, à refaire au sprint 2.
  - Test d'inscription vérifié : il devient rouge quand on retire le hachage du mot de passe.
  - « Réservation sécurisée » remplacé à l'écran par une mention honnête parce que la concurrence n'est pas gérée.
  - Comptes de démo publics dans `docker-compose.yml`, à remplacer avant tout déploiement.
  - Correction de la concurrence reportée au sprint 2 et notée dans `06-risques.md`.

# 8 octobre 2026

- **Présences** : Lina, Alexander, Karel, Hsiao Shan
- **Avancement** : Revue le web et repartir des taches du Sprint 2. Correction de la gestion (dashboard et createsession)
- **Blocage** : Dashboard
- **Décision** : Karel s'occupera de gérer le problème du dashboard

- **Avancement (Alexander)** : revue du sprint 1 à partir d'un clone neuf de l'étiquette `alpha-v1`; l'application démarre sur http://localhost:3000. Deux défauts vus : le dashboard (Karel) et le premier siège libre qui ne se laisse pas retenir (à régler). Le prof donne jusqu'au 9 octobre pour une étiquette `alpha-v2`.
- **Décision (Alexander)** : ajouter avant `alpha-v2` le README des tests, le retrait de `dist/` et les documents du sprint 1 chacun dans sa PR.

*Les lignes marquées (Alexander) ont été ajoutées le 9 octobre à partir de l'historique Git.*