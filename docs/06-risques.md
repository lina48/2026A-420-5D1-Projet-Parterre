# Risques du projet

## Risque 1 — Réservation simultanée du même siège

### Description
Deux utilisateurs peuvent tenter de réserver le même siège presque exactement au même moment.

Cela pourrait créer un conflit où le système confirme deux réservations pour un seul siège.

### Atténuation
La réservation doit être validée côté serveur avant d'être confirmée. Une opération atomique ou une contrainte dans la base de données permettra de garantir qu'un siège ne peut être réservé qu'une seule fois pour une séance donnée.



## Risque 2 — Désynchronisation de la carte des sièges

### Description
La carte affichée chez un utilisateur pourrait ne plus représenter l'état réel des réservations.

Par exemple, un siège pourrait apparaître disponible alors qu'un autre utilisateur vient de le réserver.

### Atténuation
Mettre à jour la carte des sièges en temps réel lorsqu'une réservation ou une annulation est effectuée. Le serveur demeure la source officielle pour déterminer si un siège est réellement disponible.



## Risque 3 — Difficulté technique liée au temps réel

### Description
L'équipe pourrait rencontrer des difficultés lors de l'implantation de la communication en temps réel entre le serveur et les différents utilisateurs.

Cela pourrait retarder certaines fonctionnalités du projet.

### Atténuation
Tester la fonctionnalité temps réel tôt dans le développement avec un prototype simple. L'équipe pourra ainsi identifier les problèmes techniques avant les derniers sprints.



## Risque 4 — Retard dans le développement

### Description
Certaines fonctionnalités peuvent prendre plus de temps que prévu, notamment la réservation concurrente, la gestion des séances et la mise à jour en temps réel.

### Atténuation
Prioriser les fonctionnalités essentielles dans le backlog et suivre l'avancement à chaque sprint. Les fonctionnalités moins importantes pourront être simplifiées ou reportées si nécessaire.



## Risque 5 — Erreurs dans la gestion des séances ou des salles

### Description
Une mauvaise configuration effectuée par le gérant pourrait créer une séance avec un mauvais horaire, une mauvaise salle ou un plan de sièges incorrect.

### Atténuation
Valider les informations saisies avant leur enregistrement et empêcher les configurations impossibles ou incohérentes. Des messages d'erreur clairs seront affichés lorsque les données saisies ne sont pas valides.

## Bilan du sprint 1

### Risques survenus ou toujours ouverts

- **Risque 1, réservation simultanée** : non atténué. Au 9 octobre, `server/` ne contient aucun `SELECT … FOR UPDATE`. Une place déjà prise est refusée (409), mais deux demandes simultanées ne sont pas protégées. Verrou et test de deux requêtes parallèles prévus au sprint 2.
- **Risque 3, temps réel** : l'atténuation « tester tôt » n'a pas été appliquée; la diffusion Socket.IO n'est pas faite (récit #6, sprint 2). Le risque reste entier et devient prioritaire au sprint 2.
- **Risque 4, retard** : survenu. 5 points livrés sur 34 engagés (voir le bilan dans `04-sprints.md`).
- **Risques 2 et 5** : pas réévalués au sprint 1; la désynchronisation de la carte dépend du temps réel.

### Risques disparus

Aucun risque initial n'a disparu au sprint 1.

### Nouveaux risques

| Risque | Atténuation |
|---|---|
| Changement de pile en cours de sprint : la migration vers React, TypeScript, Vite et Express a rendu du travail déjà fusionné obsolète (connexion et inscription refaites). | Annoncer tout changement structurel à l'équipe et vérifier l'état de `main` avant de pousser. |
| Démarrage et application dans le même fichier du serveur : on ne peut pas tester par import, et un gros fichier provoque des conflits. | Séparer l'application et le démarrage au début du sprint 2. |
| Couverture de tests insuffisante : seul le récit #1 est testé. | Aucun récit n'entre en revue sans tests. |
| Traces de revue incomplètes : certaines demandes de tirage ont été fusionnées sans approbation lisible. | Approbation avec commentaire avant toute fusion. |
| Secrets de démonstration : comptes de démo publics (README) et clé JWT par défaut. | Les remplacer par des variables d'environnement avant tout déploiement. |