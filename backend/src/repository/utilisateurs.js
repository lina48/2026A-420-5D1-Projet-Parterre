// repository/utilisateurs.js — tout le SQL de la table `utilisateur`,
// et rien d'autre que le SQL (voir repository/db.js).
//
// Convention (cours Applications Web 2, section 3) : les colonnes SQL
// en snake_case (mot_de_passe_hash, cree_le) sont converties en
// camelCase à la sortie du repository — le reste du code ne voit
// jamais une colonne snake_case.
import { query } from "./db.js";

function versUtilisateur(ligne) {
  if (!ligne) return null;
  return {
    id: ligne.id,
    nom: ligne.nom,
    courriel: ligne.courriel,
    motDePasseHash: ligne.mot_de_passe_hash,
    role: ligne.role,
    creeLe: ligne.cree_le,
  };
}

export async function trouverParCourriel(courriel) {
  const resultat = await query(
    "SELECT id, nom, courriel, mot_de_passe_hash, role, cree_le FROM utilisateur WHERE courriel = $1",
    [courriel]
  );
  return versUtilisateur(resultat.rows[0]);
}

/**
 * Crée un compte spectateur. Le rôle n'est JAMAIS pris depuis
 * l'appelant : un compte gestionnaire s'attribue autrement (récit
 * #14, sprint 3), donc ce repository ne sait créer que des
 * spectateurs — ce n'est pas un oubli, c'est la façon dont on empêche
 * un client de s'auto-attribuer un rôle.
 */
export async function creerSpectateur({ nom, courriel, motDePasseHash }) {
  const resultat = await query(
    `INSERT INTO utilisateur (nom, courriel, mot_de_passe_hash, role)
     VALUES ($1, $2, $3, 'spectateur')
     RETURNING id, nom, courriel, mot_de_passe_hash, role, cree_le`,
    [nom, courriel, motDePasseHash]
  );
  return versUtilisateur(resultat.rows[0]);
}

export async function trouverParId(id) {
  const resultat = await query(
    "SELECT id, nom, courriel, mot_de_passe_hash, role, cree_le FROM utilisateur WHERE id = $1",
    [id]
  );
  return versUtilisateur(resultat.rows[0]);
}
