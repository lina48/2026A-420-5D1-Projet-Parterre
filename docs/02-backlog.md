| Épique | Ce qu'elle couvre |
|---|---|
| **Comptes et rôles** | S'inscrire, se connecter, distinguer spectateurs et personnel de salle, gérer qui a le droit de programmer. |
| **Programmation de salles et séances** | Décrire une salle et son plan de places, créer des séances, les ouvrir à la vente, les modifier ou les annuler. |
| **Sélection en direct** | Consulter le plan d'une séance, voir l'état des places évoluer en direct, retenir un fauteuil le temps de finaliser. |
| **Réservation et billets** | Confirmer un achat, obtenir un billet vérifiable, retrouver et annuler ses réservations. |
| **Exploitation** | Ce qui se passe le soir de la séance et autour : contrôle des billets à l'entrée, suivi du remplissage. |
  

  ## Les récits `must` dans l'ordre

L'ordre suit les deux critères des notes de cours : la **dépendance** (on ne choisit pas un
fauteuil avant qu'une séance existe) et le **risque** (la rétention concurrente et la
diffusion temps réel sont les deux inconnues du projet, elles passent tôt (au sprint 1 )
pour qu'un échec technique reste rattrapable).

| # | Récit | Épique | Points | Sprint | Responsable |
|---|---|---|---|---|---|
| #1 | Créer un compte et se connecter | Comptes et rôles | 5 | 1 | Lina |
| #2 | Consulter l'affiche des séances à venir | Programmation | 3 | 1 | Alexander |
| #3 | Créer une séance sur un plan de salle | Programmation | 8 | 1 | Karel |
| #4 | Voir le plan de salle et l'état des places | Sélection en direct | 5 | 1 | Hsiao Shan |
| #5 | Retenir une place le temps de finaliser | Sélection en direct | 8 | 1 | Alexander |
| #6 | Voir les places changer d'état en direct | Sélection en direct | 8 | 2 | Lina |
| #7 | Confirmer sa réservation et obtenir son billet | Réservation et billets | 5 | 1 | Karel |
| #8 | Consulter ses billets à venir et passés | Réservation et billets | 2 | 2 | Hsiao Shan |
| #9 | Annuler sa réservation avant la séance | Réservation et billets | 3 | 2 | Lina |
| #10 | Bloquer des places pour raison technique ou d'accessibilité | Programmation | 3 | 2 | Alexander |
| #11 | Valider un billet à l'entrée de la salle | Exploitation | 5 | 2 | Karel |
| #12 | Modifier ou annuler une séance déjà vendue | Programmation | 8 | 3 | Hsiao Shan |
| #13 | Suivre le remplissage d'une séance en direct | Exploitation | 5 | 3 | Lina |
| #14 | Confier le rôle de gestionnaire à un membre du personnel | Comptes et rôles | 3 | 3 | Alexander |

## Autres récits et travaux

| Priorité | Récit ou travail | Sprint prévu | Points |
|---|---|---|---|
| `should` | #15 — Tarifs réduits, dont un tarif étudiant, et catégories de prix | 3 | 5 |
| `should` | #16 — Compléter les filtres de l'affiche par salle, ville et date; le filtre par genre existe déjà | 3, complément du sprint 2 | À réestimer |
| `should` | #17 — Courriel de confirmation avec le billet | Fait au sprint 2 | 3 |
| `should` | #18 — Export CSV des places vendues d'une séance | 3 | 3 |
| `could` | #19 — Suggestion des meilleures places libres pour un groupe | 3 | À estimer |
| `could` | #20 — Éditeur de plan de salle par glisser-déposer | 3 | À estimer |
| À préciser | #69 — Préparer des données réelles autorisées et conserver les données dans le volume Docker | 3 | À estimer |
| À préciser | #70 — Assistance après cinq minutes d'inactivité et suggestions de séances | 3 | À estimer |
| À préciser | #71 — Données structurées et schéma ouvert pour les séances; hébergement sur Azure | 3 | À estimer |

Les priorités, estimations et critères détaillés des récits #69 à #71 restent à raffiner; voir `04-sprints.md` pour le périmètre prévu.

**Hors portée (`won't`)** : paiement réel par carte (#21, l'étape de paiement est simulée), application mobile native (#22) et salles à placement libre non numéroté (#23).

## Notre démarche d'estimation : 

Nous avons estimé en points de récit sur une échelle de Fibonacci tronquée (1, 2, 3, 5, 8), 13 servant de signal qu'un récit était mal découpé. Les points mesurent un effort relatif (volume, complexité, incertitude), pas des heures. Notre récit de référence est le #2, « Consulter l'affiche des séances à venir », à 2 points : le plus simple du backlog, une lecture en base et un affichage de liste, sans concurrence ni état partagé. Chaque autre récit a été estimé en se demandant « combien de fois #2 ? », d'où #7 à 3 points et #5 et #6 à 8, puisqu'ils introduisent des mécanismes inconnus de l'équipe. Le vote se faisait en planning poker, à l'aveugle, pour éviter l'alignement sur le plus expérimenté. En cas de désaccord, pas de moyenne : les votes extrêmes justifiaient leur chiffre, puis nous revotions. L'écart révélait presque toujours une hypothèse non partagée, comme sur #5 où certains ne comptaient que la pose du verrou, sans l'expiration ni la libération du fauteuil abandonné. Si deux tours ne suffisaient pas, nous retenions la valeur haute et notions l'incertitude comme risque à lever tôt.