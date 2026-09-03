| Épique | Ce qu'elle couvre |
|---|---|
| **Comptes et rôles** | S'inscrire, se connecter, distinguer spectateurs et personnel de salle, gérer qui a le droit de programmer. |
| **Programmation de salles et séances ** | Décrire une salle et son plan de places, créer des séances, les ouvrir à la vente, les modifier ou les annuler. |
| **Sélection en direct** | Consulter le plan d'une séance, voir l'état des places évoluer en direct, retenir un fauteuil le temps de finaliser. |
| **Réservation et billets** | Confirmer un achat, obtenir un billet vérifiable, retrouver et annuler ses réservations. |
| **Exploitation** | Ce qui se passe le soir de la séance et autour : contrôle des billets à l'entrée, suivi du remplissage. |

  

  ## Les récits `must` dans l'ordre

L'ordre suit les deux critères des notes de cours : la **dépendance** (on ne choisit pas un
fauteuil avant qu'une séance existe) et le **risque** (la rétention concurrente et la
diffusion temps réel sont les deux inconnues du projet, elles passent tôt (au sprint 1 )
pour qu'un échec technique reste rattrapable).

| # | Récit | Épique | Points | Sprint |
|---|---|---|---|---|
| #1 | Créer un compte et se connecter | Comptes et rôles | 5 | 1 |
| #2 | Consulter l'affiche des séances à venir | Programmation | 2 | 1 |
| #3 | Créer une séance sur un plan de salle | Programmation | 8 | 1 |
| #4 | Voir le plan de salle et l'état des places | Sélection en direct | 5 | 1 |
| #5 | Retenir une place le temps de finaliser | Sélection en direct | 8 | 1 |
| #6 | Voir les places changer d'état en direct | Sélection en direct | 8 | 1 |
| #7 | Confirmer sa réservation et obtenir son billet | Réservation et billets | 3 | 1 |
| #8 | Consulter ses billets à venir et passés | Réservation et billets | 2 | 2 |
| #9 | Annuler sa réservation avant la séance | Réservation et billets | 3 | 2 |
| #10 | Bloquer des places pour raison technique ou d'accessibilité | Programmation | 3 | 2 |
| #11 | Valider un billet à l'entrée de la salle | Exploitation | 5 | 2 |
| #12 | Modifier ou annuler une séance déjà vendue | Programmation | 8 | 3 |
| #13 | Suivre le remplissage d'une séance en direct | Exploitation | 5 | 3 |
| #14 | Confier le rôle de gestionnaire à un membre du personnel | Comptes et rôles | 3 | 3 | 

Le reste du backlog, pour situer : 
 `should`  
tarifs réduits et catégories de prix (#15),
filtrer l'affiche par ville, date et genre (#16),  
courriel de confirmation avec le billet(#17),  
export CSV des ventes d'une séance (#18). 
  `could`  
suggestion automatique des
meilleures places libres pour *n* spectateurs (#19),  
éditeur de plan de salle par glisser-déposer (#20).  
  `won't`   
paiement réel par carte (#21, on simule l'étape de
paiement),  
application mobile native (#22),  
salles à placement libre non numéroté (#23,
elles n'ont aucun besoin d'un plan de salle et videraient le projet de son intérêt).
