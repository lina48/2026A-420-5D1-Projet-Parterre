[journal.md](https://github.com/user-attachments/files/32074156/journal.md)
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
- **Avancement** : Mêlée de 10 minutes sur l’état du projet. Chaque membre a fait le point sur ses tâches et sur les récits qu’il doit mener. La base de données a été revue et les règles d’intégrité ont été renforcées.
- **Blocage** : Incohérence de la conception de la base de données, notamment sur l’unicité des places par séance, les tables de jointure de réservation, la cohérence salle/place/séance et la gestion de l’annulation sans perdre une place définitivement.
- **Décisions** :
  - Correction de la table `place_seance` avec `UNIQUE (place_id, seance_id)` pour éviter les doublons.
  - Correction de `reservation_place` avec une clé composite et un index unique partiel `WHERE active` pour permettre l’annulation sans bloquer définitivement la place.
  - Ajout de la cohérence salle/place/séance via les clés composites et les contraintes de relation.
  - Vérification stricte du statut de retenue avec `CHECK` pour empêcher les états incohérents.
  - Revue de la structure finale de la base avec PostgreSQL pour aligner le design avec les exigences de concurrence, d’annulation et de temps réel.


*Les entrées du 28 septembre et du 1er octobre ont été rédigées le 1er octobre à partir de l'historique Git et de nos échanges de travail.*

## 28 septembre 2026 (bloc 5, point de contrôle 2)

- **Présences** : Tout l'équipe
- **Avancement** : Backend du récit #1 (inscription, connexion, hachage des mots de passe, session, Docker, CI). PR #28 revue par Lina. Point de contrôle 2 passé : démarrage depuis un clone neuf, CI verte.
- **Blocage** : Lina a restructuré la pile (React, TypeScript, Vite) le même jour, donc le backend d'Alexander doit être refait sur la nouvelle structure.
- **Décisions** :
  - Passage à React pour suivre `01-vision.md` (décision d'équipe).
  - `bcryptjs` plutôt que `bcrypt` pour éviter les problèmes de compilation dans l'image Alpine.

## 1er octobre 2026 (bloc 6, remise)

- **Présences** : Lina
- **Avancement** : #1 refait sur la nouvelle structure (PR #32), PR #33 (Docker, CI) et #34 (README) fusionnées. Ensuite : PR #41 (7 tests d'intégration de l'authentification avec `node:test`, la CI lance maintenant `npm test`), PR #38 (section « Ce qui est simulé » du README), PR #39 (mentions « simulé » à l'écran), PR #42 (comptes de démonstration), et la route `/gestion` qui manquait dans `App.tsx` (43). La PR #35 de Karel (dashboard et création de séance) avait une CI rouge à 15 h (erreur de syntaxe dans une requête SQL de `server/index.ts`). Karel l'a corrigée et elle est fusionnée.
- **Blocage** : La concurrence (D1) n'est pas implémentée : pas de `FOR UPDATE` sur retenir et réserver (#5, #7), et aucun test sur ces récits. Les styles de la page de création de séance ne sont pas dans la PR #35. La route `/gestion` manquait, ce qui menait à une page 404 après la création d'une séance.
- **Décisions** :
  - Les tests lancent `server/index.ts` comme un vrai processus sur un port libre, au lieu de séparer `index.ts` en `app.ts`, parce que la PR #35 modifiait déjà ce fichier. C'est moins fidèle au cours, à refaire au sprint 2.
  - Le test d'inscription a été vérifié : il devient rouge quand on retire le hachage du mot de passe.
  - « Réservation sécurisée » remplacé à l'écran par une mention honnête, puisque la concurrence n'est pas gérée.
  - Comptes de démo publics dans `docker-compose.yml`, à remplacer avant tout déploiement.
  - Correction de la concurrence reportée au sprint 2 et écrite dans `06-risques.md`.


*Ce journal continue d'être tenu à chaque bloc de cours pour le reste de la session.*
