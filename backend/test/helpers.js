// helpers.js — utilitaire partagé par les tests d'intégration, dans
// l'esprit de startServer()/api.request() vu en Applications Web 2
// (section 6). Utilise fetch, natif à Node, pas de supertest.
import { creerApp } from "../src/app.js";
import { query } from "../src/repository/db.js";

export async function startServer() {
  const app = creerApp();
  const serveur = await new Promise((resolve) => {
    const s = app.listen(0, () => resolve(s));
  });
  const { port } = serveur.address();
  const base = `http://localhost:${port}`;

  return {
    async request(methode, chemin, corps) {
      const reponse = await fetch(base + chemin, {
        method: methode,
        headers: corps ? { "Content-Type": "application/json" } : undefined,
        body: corps ? JSON.stringify(corps) : undefined,
      });
      const texte = await reponse.text();
      let donnees;
      try {
        donnees = texte ? JSON.parse(texte) : undefined;
      } catch {
        donnees = texte;
      }
      return { status: reponse.status, donnees, entetes: reponse.headers };
    },
    close() {
      return new Promise((resolve) => serveur.close(resolve));
    },
  };
}

/** Base de test propre avant chaque fichier de test. */
export async function viderTables() {
  await query("TRUNCATE TABLE utilisateur RESTART IDENTITY CASCADE");
}
