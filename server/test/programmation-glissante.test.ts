import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { startServer, requete } from './helpers.js';

let serveur: Awaited<ReturnType<typeof startServer>>;
const idsCrees: string[] = [];
let dansTroisJours: string;
let dernierJour: string;
let lendemainDeLaFenetre: string;

/**
 * Copie une séance existante (même salle, même film, mêmes places) à un autre moment :
 * `jours` jours après aujourd'hui, à l'heure `heure` (heure de Montréal).
 * Les heures choisies (18 h 41, 23 h 17, 0 h 05) ne ressemblent pas à la vraie programmation.
 */
async function creerSeance(modeleId: string, jours: number, heure: string): Promise<string> {
  const [{ id }] = await requete(
    `INSERT INTO seance (salle_id, film_id, date_heure)
     SELECT salle_id, film_id,
            (((NOW() AT TIME ZONE 'America/Toronto')::date + $2::int) + $3::time) AT TIME ZONE 'America/Toronto'
     FROM seance WHERE id = $1::bigint
     RETURNING id`,
    [modeleId, jours, heure]
  );
  await requete(
    `INSERT INTO place_seance (place_id, salle_id, seance_id, etat, zone, prix)
     SELECT place_id, salle_id, $2::bigint, 'libre', zone, prix
     FROM place_seance WHERE seance_id = $1::bigint`,
    [modeleId, id]
  );
  idsCrees.push(String(id));
  return String(id);
}

/** Les identifiants (en texte) des séances que l'API renvoie pour cette adresse. */
async function idsListes(chemin: string): Promise<string[]> {
  const { status, donnees } = await serveur.request('GET', chemin);
  assert.equal(status, 200);
  return donnees.seances.map((seance: any) => String(seance.id));
}

before(async () => {
  serveur = await startServer();

  // Le serveur sème des séances au démarrage : on copie l'une d'elles, avec ses places.
  const [modele] = await requete(
    `SELECT s.id FROM seance s
     WHERE EXISTS (SELECT 1 FROM place_seance ps WHERE ps.seance_id = s.id)
     ORDER BY s.id LIMIT 1`
  );
  dansTroisJours = await creerSeance(modele.id, 3, '18:41');
  dernierJour = await creerSeance(modele.id, 7, '23:17');
  lendemainDeLaFenetre = await creerSeance(modele.id, 8, '00:05');
});

after(async () => {
  // La base de test persiste entre deux exécutions : on retire nos séances de test.
  if (idsCrees.length) {
    await requete('DELETE FROM place_seance WHERE seance_id = ANY($1::bigint[])', [idsCrees]);
    await requete('DELETE FROM seance WHERE id = ANY($1::bigint[])', [idsCrees]);
  }
  await serveur.close();
});

test('sans paramètre, la liste contient toutes les séances à venir', async () => {
  const ids = await idsListes('/api/seances');
  assert.ok(ids.includes(dansTroisJours));
  assert.ok(ids.includes(dernierJour));
  assert.ok(ids.includes(lendemainDeLaFenetre));
});

test('?jours=7 garde le dernier jour de la fenêtre et retire le lendemain', async () => {
  const ids = await idsListes('/api/seances?jours=7');
  assert.ok(ids.includes(dansTroisJours), 'une séance dans 3 jours doit apparaître');
  assert.ok(ids.includes(dernierJour), 'une séance dans 7 jours (23 h 17) doit encore apparaître');
  assert.ok(!ids.includes(lendemainDeLaFenetre), 'une séance dans 8 jours (0 h 05) ne doit pas apparaître');
});

test('?jours=3 raccourcit la fenêtre', async () => {
  const ids = await idsListes('/api/seances?jours=3');
  assert.ok(ids.includes(dansTroisJours), 'une séance dans 3 jours doit apparaître');
  assert.ok(!ids.includes(dernierJour), 'une séance dans 7 jours ne doit pas apparaître');
});

test('un nombre de jours invalide est refusé', async () => {
  for (const valeur of ['0', '-1', 'abc', '7.5', '61', '']) {
    const { status, donnees } = await serveur.request('GET', `/api/seances?jours=${valeur}`);
    assert.equal(status, 400, `jours=${valeur} devrait être refusé`);
    assert.match(donnees.error, /entier entre 1 et 60/);
  }
});
