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
- **Décisions** : Engagement du sprint 1 fixé à 15 points, après correction du biais d'optimisme (-30 % sur une première estimation de 20 points). Rôle de Scrum Master fixé en rotation — Lina au sprint 1, Alexander au sprint 2, Karel au sprint 3.

---

*Ce journal continue d'être tenu à chaque bloc de cours pour le reste de la session.*
