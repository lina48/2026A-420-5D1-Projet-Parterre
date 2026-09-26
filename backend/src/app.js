// app.js — les routes Express.
//
// Déviation documentée par rapport au modèle du cours (qui ne sert
// que du JSON, le rendu HTML étant fait par un frontend React Router
// séparé) : ce projet n'utilise pas React Router, seulement du
// HTML/CSS/JS simple (choix d'équipe), donc CE serveur sert aussi les
// pages statiques en plus de l'API JSON. La référence du cours
// prévoit explicitement ce cas (section 1).
import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";

import * as utilisateurs from "./repository/utilisateurs.js";
import { hacherMotDePasse, verifierMotDePasse } from "./motDePasse.js";
import { estCourrielValide, motDePasseAssezLong } from "./validation.js";
import { poserCookieSession, retirerCookieSession } from "./session.js";
import { utilisateurCourant } from "./auth.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function creerApp() {
  const app = express();
  app.use(express.json());

  // Sert connexionSignUp/ à la racine : connexion.html, inscription.html, css/, js/
  app.use(express.static(path.join(__dirname, "../../connexionSignUp")));

  app.post("/api/auth/inscription", async (req, res) => {
    const nom = req.body?.nomComplet?.trim();
    const courriel = req.body?.email?.trim().toLowerCase();
    const motDePasse = req.body?.motDePasse;

    if (!nom) {
      return res.status(400).json({ message: "Le nom complet est requis." });
    }
    if (!estCourrielValide(courriel)) {
      return res.status(400).json({ message: "L'adresse courriel n'est pas valide." });
    }
    if (!motDePasseAssezLong(motDePasse)) {
      return res.status(400).json({ message: "Le mot de passe doit contenir au moins 8 caractères." });
    }

    // Le rôle envoyé par le client (`req.body.role`) n'est jamais lu :
    // creerSpectateur() du repository ne sait créer que des comptes
    // spectateur (voir le commentaire dans repository/utilisateurs.js).
    // On ne fait jamais confiance à un rôle fourni par le client.
    try {
      const motDePasseHash = await hacherMotDePasse(motDePasse);
      const utilisateur = await utilisateurs.creerSpectateur({ nom, courriel, motDePasseHash });

      poserCookieSession(res, utilisateur.id);
      return res.status(201).json({
        id: utilisateur.id,
        nom: utilisateur.nom,
        email: utilisateur.courriel,
        role: utilisateur.role,
      });
    } catch (erreur) {
      if (erreur.code === "23505") {
        // violation de contrainte UNIQUE (courriel) — PostgreSQL
        return res.status(409).json({ message: "Un compte existe déjà avec ce courriel." });
      }
      throw erreur;
    }
  });

  app.post("/api/auth/connexion", async (req, res) => {
    const courriel = req.body?.email?.trim().toLowerCase();
    const motDePasse = req.body?.motDePasse;

    if (!estCourrielValide(courriel) || !motDePasse) {
      return res.status(400).json({ message: "Courriel et mot de passe requis." });
    }

    const utilisateur = await utilisateurs.trouverParCourriel(courriel);
    // Même message que le mot de passe soit faux ou que le compte
    // n'existe pas : ne jamais révéler à un attaquant si un courriel
    // est enregistré ou non.
    if (!utilisateur) {
      return res.status(401).json({ message: "Courriel ou mot de passe incorrect." });
    }

    const motDePasseValide = await verifierMotDePasse(motDePasse, utilisateur.motDePasseHash);
    if (!motDePasseValide) {
      return res.status(401).json({ message: "Courriel ou mot de passe incorrect." });
    }

    poserCookieSession(res, utilisateur.id);
    return res.status(200).json({
      id: utilisateur.id,
      nom: utilisateur.nom,
      email: utilisateur.courriel,
      role: utilisateur.role,
    });
  });

  app.post("/api/auth/deconnexion", (req, res) => {
    retirerCookieSession(res);
    return res.status(204).end();
  });

  // Exemple de route protégée, dans l'esprit de currentAccount() :
  // l'autorisation se décide côté serveur, jamais seulement en
  // cachant un bouton côté client.
  app.get("/api/auth/moi", async (req, res) => {
    const utilisateur = await utilisateurCourant(req);
    if (!utilisateur) {
      return res.status(401).json({ message: "Aucune session active." });
    }
    return res.status(200).json({
      id: utilisateur.id,
      nom: utilisateur.nom,
      email: utilisateur.courriel,
      role: utilisateur.role,
    });
  });

  return app;
}
