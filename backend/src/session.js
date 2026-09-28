// session.js — cookie de session signé fait main, calqué sur le
// modèle vu en Applications Web 2 (section 4) : pas de bibliothèque
// comme express-session, pas de JWT.
//
// Format du cookie : "<contenu JSON en base64url>.<signature HMAC-SHA256>"
// — signé, pas chiffré (le contenu reste lisible ; seule la signature
// empêche de le modifier sans connaître SESSION_SECRET).
import { createHmac, timingSafeEqual } from "node:crypto";

const NOM_COOKIE = "session_siegevif";
const DUREE_MS = 7 * 24 * 60 * 60 * 1000; // une semaine

function secret() {
  const valeur = process.env.SESSION_SECRET;
  if (!valeur) {
    throw new Error("SESSION_SECRET manquant — voir .env.example");
  }
  return valeur;
}

function signer(contenuBase64) {
  return createHmac("sha256", secret()).update(contenuBase64).digest("base64url");
}

/** Construit la valeur du cookie pour un utilisateur qui vient de se connecter. */
export function signerSession(utilisateurId) {
  const contenu = { utilisateurId, exp: Date.now() + DUREE_MS };
  const contenuBase64 = Buffer.from(JSON.stringify(contenu)).toString("base64url");
  return `${contenuBase64}.${signer(contenuBase64)}`;
}

// Pas de dépendance cookie-parser : on lit l'en-tête Cookie à la main
// (Express sait déjà ÉCRIRE un cookie nativement avec res.cookie, mais
// ne les LIT pas sans ce middleware — dans le même esprit minimaliste
// que le cours, on évite la dépendance pour une seule ligne de calcul).
function cookieDeLaRequete(req, nom) {
  const entete = req.headers.cookie;
  if (!entete) return undefined;
  for (const paire of entete.split(";")) {
    const indexEgal = paire.indexOf("=");
    if (indexEgal === -1) continue;
    const cle = paire.slice(0, indexEgal).trim();
    if (cle === nom) return decodeURIComponent(paire.slice(indexEgal + 1).trim());
  }
  return undefined;
}

/** Lit et vérifie le cookie de la requête ; renvoie l'id ou null si absent/invalide/expiré. */
export function lireUtilisateurIdDeSession(req) {
  const valeurCookie = cookieDeLaRequete(req, NOM_COOKIE);
  if (!valeurCookie) return null;

  const [contenuBase64, signatureRecue] = valeurCookie.split(".");
  if (!contenuBase64 || !signatureRecue) return null;

  const signatureAttendue = signer(contenuBase64);
  const a = Buffer.from(signatureRecue);
  const b = Buffer.from(signatureAttendue);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  try {
    const contenu = JSON.parse(Buffer.from(contenuBase64, "base64url").toString("utf8"));
    if (contenu.exp < Date.now()) return null;
    return contenu.utilisateurId;
  } catch {
    return null;
  }
}

export function poserCookieSession(res, utilisateurId) {
  res.cookie(NOM_COOKIE, signerSession(utilisateurId), {
    httpOnly: true, // invisible à document.cookie — protège du vol par XSS
    sameSite: "lax", // défense de base contre le CSRF
    path: "/",
    maxAge: DUREE_MS,
  });
}

export function retirerCookieSession(res) {
  res.clearCookie(NOM_COOKIE, { path: "/" });
}
