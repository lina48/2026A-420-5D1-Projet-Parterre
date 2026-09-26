// motDePasse.js — hachage et vérification du mot de passe.
//
// Ce n'est PAS une technique vue dans Applications Web 2 (ce cours
// délègue l'authentification à GitHub via OAuth, voir la référence du
// cours, section 4) — mais l'énoncé du sprint 1 de Projet 3 la
// considère comme un acquis d'un cours précédent, pas une nouveauté du
// sprint 2. On utilise `crypto.scrypt`, natif à Node (comme
// `node:sqlite` et `node:test` dans Applications Web 2) plutôt qu'une
// dépendance externe comme bcrypt, pour rester dans le même esprit
// « pas de bibliothèque tierce quand Node sait déjà le faire ».
//
// Principe : on ne stocke jamais le mot de passe, seulement un sel
// aléatoire + le résultat d'une fonction à sens unique (scrypt) sur
// « sel + mot de passe ». Pour vérifier, on refait le même calcul
// avec le sel stocké et on compare les deux résultats.
import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCallback);
const TAILLE_SEL = 16;
const TAILLE_HACHAGE = 64;

/** Renvoie une chaîne "sel:hachage" (les deux en hexadécimal) à stocker en base. */
export async function hacherMotDePasse(motDePasse) {
  const sel = randomBytes(TAILLE_SEL);
  const hachage = await scrypt(motDePasse, sel, TAILLE_HACHAGE);
  return `${sel.toString("hex")}:${hachage.toString("hex")}`;
}

/** Compare un mot de passe en clair au "sel:hachage" stocké. */
export async function verifierMotDePasse(motDePasse, motDePasseHash) {
  const [selHex, hachageHex] = motDePasseHash.split(":");
  if (!selHex || !hachageHex) return false;

  const sel = Buffer.from(selHex, "hex");
  const hachageAttendu = Buffer.from(hachageHex, "hex");
  const hachageCalcule = await scrypt(motDePasse, sel, hachageAttendu.length);

  // timingSafeEqual plutôt que === : évite qu'un attaquant devine le
  // hachage octet par octet en mesurant le temps de réponse.
  return timingSafeEqual(hachageAttendu, hachageCalcule);
}
