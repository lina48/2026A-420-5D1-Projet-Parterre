// repository/db.js — la SEULE porte d'entrée vers PostgreSQL.
// Règle du cours Applications Web 2, section 2 : aucune requête SQL en
// dehors du dossier repository/. Les routes et la logique métier ne
// connaissent jamais le moteur de base de données, seulement des
// fonctions qui renvoient des objets JavaScript.
import pg from "pg";

const { Pool } = pg;

// Une seule connexion partagée, ouverte au démarrage du serveur (ou du
// test), jamais une par requête — c'est pg.Pool qui gère l'attente et
// la réutilisation des connexions sous le capot.
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

/**
 * Exécute une requête paramétrée. Toujours des paramètres numérotés
 * ($1, $2, ...), jamais une valeur collée dans la chaîne SQL — c'est
 * la protection contre l'injection SQL.
 */
export function query(texte, parametres) {
  return pool.query(texte, parametres);
}

/** Utilisé seulement par les tests, pour fermer proprement à la fin. */
export function fermerPool() {
  return pool.end();
}
