// auth.js — le pont entre le cookie de session et le compte réel en
// base, comme `currentAccount(req)` dans la référence du cours.
import { lireUtilisateurIdDeSession } from "./session.js";
import * as utilisateurs from "./repository/utilisateurs.js";

export async function utilisateurCourant(req) {
  const utilisateurId = lireUtilisateurIdDeSession(req);
  if (!utilisateurId) return null;
  return (await utilisateurs.trouverParId(utilisateurId)) ?? null;
}
