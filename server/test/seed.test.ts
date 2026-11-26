import { test } from 'node:test';
import assert from 'node:assert/strict';
import { startServer, requete } from './helpers.js';

/** Nombre de lignes dans chaque table que le seed remplit. */
async function compterLesDonnees() {
  const [compte] = await requete(
    `SELECT
       (SELECT COUNT(*) FROM film)::int AS films,
       (SELECT COUNT(*) FROM salle)::int AS salles,
       (SELECT COUNT(*) FROM place)::int AS places,
       (SELECT COUNT(*) FROM seance)::int AS seances,
       (SELECT COUNT(*) FROM place_seance)::int AS places_de_seance`
  );
  return compte;
}

test('un deuxième démarrage du serveur ne crée aucun doublon', async () => {
  const premier = await startServer();
  await premier.close();
  const apresLePremier = await compterLesDonnees();

  const second = await startServer();
  await second.close();
  const apresLeSecond = await compterLesDonnees();

  assert.ok(apresLePremier.seances > 0, 'le seed doit créer des séances');
  assert.deepEqual(apresLeSecond, apresLePremier);
});

test('les séances de la programmation sont à l’heure de Montréal', async () => {
  const lignes = await requete(
    `SELECT DISTINCT to_char(s.date_heure AT TIME ZONE 'America/Toronto', 'HH24:MI') AS heure
     FROM seance s
     JOIN salle sa ON sa.id = s.salle_id
     WHERE sa.nom IN ('Beaubien · Salle 1', 'Cinéma du Parc · Salle 2', 'Quartier Latin · Salle 9')`
  );

  const heures = lignes.map((ligne) => ligne.heure).sort();

  assert.deepEqual(heures, ['18:00', '18:30', '19:00', '20:45', '21:00', '21:30']);
});
