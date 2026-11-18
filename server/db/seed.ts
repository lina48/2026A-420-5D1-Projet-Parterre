import { pool } from './pool';

export async function seed() {
  const { rows: upcomingShows } = await pool.query(
    "SELECT id FROM seance WHERE statut = 'ouverte' AND date_heure > NOW() LIMIT 1"
  );
  if (upcomingShows.length) return;

  const client = await pool.connect();

  try {

    await client.query('BEGIN');
    const { rows: rooms } = await client.query('SELECT id FROM salle ORDER BY id LIMIT 1');
    const room = rooms[0] ?? (await client.query(
      "INSERT INTO salle (nom, capacite) VALUES ('Salle Lumière', 72) RETURNING id"
    )).rows[0];
    const { rows: placeCount } = await client.query('SELECT COUNT(*)::int AS total FROM place WHERE salle_id = $1', [room.id]);
    if (!placeCount[0].total) {
      for (const row of 'ABCDEFGH') for (let number = 1; number <= 9; number += 1) {
        await client.query(
          'INSERT INTO place (salle_id, rangee, numero, type) VALUES ($1, $2, $3, $4) ON CONFLICT (salle_id, rangee, numero) DO NOTHING',
          [room.id, row, number, row === 'H' && number <= 2 ? 'accessible' : 'standard']
        );
      }
    }
    let { rows: films } = await client.query('SELECT id FROM film ORDER BY id LIMIT 3');
    if (!films.length) {
      const movieRows = await client.query(
        `INSERT INTO film (titre, duree_minutes, genre, image_url, description) VALUES
         ('Les heures bleues', 118, 'Drame', 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1200&q=85', 'Une nuit suffit parfois à changer le cours d’une vie.'),
         ('Le dernier été', 104, 'Comédie', 'https://images.unsplash.com/photo-1478720568477-152d9b164e26?auto=format&fit=crop&w=1200&q=85', 'Une parenthèse lumineuse au bord de la mer.'),
         ('Mondes parallèles', 132, 'Science-fiction', 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&w=1200&q=85', 'À la frontière du réel, une autre histoire commence.')
         RETURNING id`
      );
      films = movieRows.rows;
    }
    const filmIds = films.map((row) => row.id as number);
    const schedule: Array<[number, number]> = [[0, 18], [1, 20], [2, 21], [0, 22]];
    for (const [index, hour] of schedule) {

      const starts = new Date();

      if (index === 3 || hour <= starts.getHours()) {
        starts.setDate(starts.getDate() + 1);
      }

      starts.setHours(hour, 0, 0, 0);
      const show = await client.query(
        'INSERT INTO seance (salle_id, film_id, date_heure) VALUES ($1, $2, $3) RETURNING id',
        [room.id, filmIds[index % filmIds.length], starts]
      );
      const showId = show.rows[0].id;

      await client.query(
  `INSERT INTO place_seance (
    place_id,
    salle_id,
    seance_id,
    zone,
    prix
  )
  SELECT
    id,
    salle_id,
    $1,
    'standard',
    22
  FROM place
  WHERE salle_id = $2
  ON CONFLICT (place_id, seance_id) DO NOTHING`,
  [
    showId,
    room.id
  ]
);

    }

    await client.query('COMMIT');

  } catch (error) {

    await client.query('ROLLBACK');
    throw error;

  } finally {

    client.release();

  }

}