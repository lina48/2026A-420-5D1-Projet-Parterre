// validation.js — fonctions de logique métier PURES (aucun accès à
// req/res, aucun accès à la base) : faciles à tester isolément, comme
// `calculateScore` dans la référence du cours (section 6).

export function estCourrielValide(valeur) {
  return typeof valeur === "string" && /^\S+@\S+\.\S+$/.test(valeur);
}

export function motDePasseAssezLong(valeur) {
  return typeof valeur === "string" && valeur.length >= 8;
}
