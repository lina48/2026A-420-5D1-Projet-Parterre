import 'dotenv/config';
import express, { type NextFunction, type Request, type Response } from 'express';
import { createServer } from 'node:http';
import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Server } from 'socket.io';
import { pool } from './db/pool';
import { asyncRoute, createToken, requireAuth, requireManager, type AuthRequest, type User } from './middleware/auth';
import bcrypt from 'bcryptjs';


const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, { cors: { origin: process.env.CLIENT_ORIGIN ?? 'http://localhost:5173' } });
const port = Number(process.env.PORT ?? 4000);
const here = path.dirname(fileURLToPath(import.meta.url));

app.use(express.json());

app.post('/api/auth/connexion', asyncRoute(async (request, response) => {
  const { courriel, motDePasse } = request.body as { courriel?: string; motDePasse?: string };
  if (!courriel?.trim() || !motDePasse) return response.status(400).json({ error: 'Courriel et mot de passe requis.' });
  const { rows } = await pool.query(
    'SELECT id, nom, courriel, role, mot_de_passe_hash FROM utilisateur WHERE courriel = $1',
    [courriel.trim().toLowerCase()]
  );
  const row = rows[0];
  if (!row || !(await bcrypt.compare(motDePasse, row.mot_de_passe_hash))) {
    return response.status(401).json({ error: 'Courriel ou mot de passe invalide.' });
  }
  const user = { id: row.id, nom: row.nom, courriel: row.courriel, role: row.role };
  response.json({ token: createToken(user), user });
}));

async function seed() {
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


const secret = process.env.JWT_SECRET ?? 'dev-secret-change-me';


app.post('/api/auth/inscription', asyncRoute(async (request, response) => {

  const { nom, courriel, motDePasse } = request.body as {
    nom?: string;
    courriel?: string;
    motDePasse?: string;
  };

  if (!nom?.trim() || !courriel?.trim() || !motDePasse || motDePasse.length < 8) {
    return response.status(400).json({
      error: 'Nom, courriel et mot de passe (8 caractères min.) requis.'
    });
  }

  const hash = await bcrypt.hash(motDePasse, 10);

  const { rows } = await pool.query(
    'INSERT INTO utilisateur (nom, courriel, mot_de_passe_hash) VALUES ($1, $2, $3) RETURNING id, nom, courriel, role',
    [
      nom.trim(),
      courriel.trim().toLowerCase(),
      hash
    ]
  );

  const user = rows[0] as User;
  const token = createToken(user);
  response.status(201).json({ token, user });
}));

async function seedInitialManager() {
  const name = process.env.INITIAL_ADMIN_NAME?.trim();
  const email = process.env.INITIAL_ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.INITIAL_ADMIN_PASSWORD;
  const configuredValues = [name, email, password].filter(Boolean).length;
  if (configuredValues === 0) return;
  if (!name || !email || !password) {
    throw new Error('INITIAL_ADMIN_NAME, INITIAL_ADMIN_EMAIL et INITIAL_ADMIN_PASSWORD doivent être configurés ensemble.');
  }
  if (password.length < 12) throw new Error('INITIAL_ADMIN_PASSWORD doit contenir au moins 12 caractères.');

  const passwordHash = await bcrypt.hash(password, 10);
  const { rowCount } = await pool.query(
    `INSERT INTO utilisateur (nom, courriel, mot_de_passe_hash, role)
     VALUES ($1, $2, $3, 'gestionnaire')
     ON CONFLICT (courriel) DO NOTHING`,
    [name, email, passwordHash]
  );
  if (rowCount) console.log(`Compte gestionnaire initial créé pour ${email}.`);
}


app.get('/api/seances', asyncRoute(async (_request, response) => {

  const { rows } = await pool.query(
    `SELECT
       s.id,
       s.date_heure,
       s.statut,
       sa.nom AS salle,
       sa.lieu,
       f.titre,
       f.genre,
       f.duree_minutes,
       f.image_url,
       f.description,
       f.sous_titre,
       f.spectacle_type,
       COUNT(ps.id) FILTER (WHERE ps.zone <> 'bloque')::int AS capacite,
       COUNT(ps.id) FILTER (WHERE ps.etat = 'libre' AND ps.zone <> 'bloque')::int AS places_disponibles
     FROM seance s
     JOIN salle sa ON sa.id = s.salle_id
     JOIN film f ON f.id = s.film_id
     JOIN place_seance ps ON ps.seance_id = s.id
     WHERE s.date_heure > NOW() AND s.statut = 'ouverte'
     GROUP BY s.id, sa.id, f.id
     ORDER BY s.date_heure`
  );

  response.json({
    seances: rows
  });

}));


app.get('/api/seances/:id/plan', asyncRoute(async (request, response) => {

  const { rows } = await pool.query(
    `SELECT
       ps.id,
       p.rangee,
       p.numero,
       p.type,
       ps.etat,
       ps.zone,
       ps.prix,
       (ps.retenue_expire_a > NOW()) AS retenue_active
     FROM place_seance ps
     JOIN place p ON p.id = ps.place_id
     WHERE ps.seance_id = $1
     ORDER BY p.rangee, p.numero`,
    [request.params.id]
  );

  if (!rows.length) {
    return response.status(404).json({
      error: 'Séance introuvable.'
    });
  }

  response.json({
    places: rows
  });

}));


app.post('/api/seances/:id/places/:placeId/retenir', requireAuth, asyncRoute(async (request, response) => {

  const { rows } = await pool.query(
    'SELECT * FROM place_seance WHERE seance_id = $1 AND id = $2',
    [
      request.params.id,
      request.params.placeId
    ]
  );

  const seat = rows[0];

  if (!seat) {
    return response.status(404).json({
      error: 'Place introuvable.'
    });
  }

  if (seat.zone === 'bloque') {
    return response.status(409).json({
      error: 'Cette place est bloquée.'
    });
  }
  const expires = new Date(Date.now() + 5 * 60 * 1000);
  await pool.query("UPDATE place_seance SET etat = 'retenue', retenue_par_utilisateur_id = $1, retenue_expire_a = $2 WHERE id = $3", [request.user!.id, expires, seat.id]);
  const change = { id: seat.id, etat: 'retenue', expireA: expires.toISOString() };
  io.to(`seance:${request.params.id}`).emit('place:etat_change', change);
  response.json({ place: change });
}));


app.post('/api/reservations', requireAuth, asyncRoute(async (request, response) => {

  const { seanceId, placeIds } = request.body as {
    seanceId?: number;
    placeIds?: number[];
  };

  const ids = [...new Set(placeIds ?? [])];

  if (!seanceId || !ids.length || ids.length > 8) {
    return response.status(400).json({
      error: 'Sélectionnez de 1 à 8 places.'
    });
  }

  const { rows: seats } = await pool.query(
    `SELECT
       ps.*,
       p.rangee,
       p.numero
     FROM place_seance ps
     JOIN place p ON p.id = ps.place_id
     WHERE ps.seance_id = $1
       AND ps.id = ANY($2::bigint[])
     ORDER BY ps.id`,
    [
      seanceId,
      ids
    ]
  );

  if (
    seats.length !== ids.length ||
    seats.some(
      (seat) =>
        seat.zone === 'bloque' ||
        seat.etat !== 'retenue' ||
        seat.retenue_par_utilisateur_id !== request.user!.id ||
        seat.retenue_expire_a <= new Date()
    )
  ) {
    return response.status(409).json({
      error: 'Une ou plusieurs rétentions ont expiré. Sélectionnez vos places à nouveau.'
    });
  }

  const code = `PT-${randomUUID().slice(0, 8).toUpperCase()}`;

  const montantTotal = seats.reduce(
    (total, seat) => total + Number(seat.prix ?? 14.5),
    0
  );

  const booking = await pool.query(
    'INSERT INTO reservation (utilisateur_id, seance_id, code_billet, montant_total) VALUES ($1, $2, $3, $4) RETURNING id, code_billet, montant_total, creee_le',
    [
      request.user!.id,
      seanceId,
      code,
      montantTotal
    ]
  );

  const reservation = booking.rows[0];

  for (const seat of seats) {

    await pool.query(
      'INSERT INTO reservation_place (reservation_id, place_seance_id, seance_id) VALUES ($1, $2, $3)',
      [
        reservation.id,
        seat.id,
        seanceId
      ]
    );

  }

  await pool.query(
    "UPDATE place_seance SET etat = 'vendue', retenue_par_utilisateur_id = NULL, retenue_expire_a = NULL WHERE id = ANY($1::bigint[])",
    [ids]
  );

  ids.forEach((id) => {
    io.to(`seance:${seanceId}`).emit(
      'place:etat_change',
      {
        id,
        etat: 'vendue'
      }
    );
  });

  response.status(201).json({
    reservation: {
      ...reservation,
      places: seats.map(
        ({
          id,
          rangee,
          numero
        }) => ({
          id,
          rangee,
          numero
        })
      )
    }
  });

}));


app.get('/api/reservations', requireAuth, asyncRoute(async (request, response) => {

  const { rows } = await pool.query(
    `SELECT
       r.id,
       r.code_billet,
       r.montant_total,
       r.creee_le,
       r.statut,
       s.date_heure,
       f.titre,
       f.image_url,
       json_agg(
         json_build_object(
           'rangee', p.rangee,
           'numero', p.numero
         )
         ORDER BY p.rangee, p.numero
       ) AS places
     FROM reservation r
     JOIN seance s ON s.id = r.seance_id
     JOIN film f ON f.id = s.film_id
     JOIN reservation_place rp ON rp.reservation_id = r.id
     JOIN place_seance ps ON ps.id = rp.place_seance_id
     JOIN place p ON p.id = ps.place_id
     WHERE r.utilisateur_id = $1
     GROUP BY r.id, s.date_heure, f.titre, f.image_url
     ORDER BY r.creee_le DESC`,
    [request.user!.id]
  );

  response.json({
    reservations: rows
  });

}));


app.delete('/api/reservations/:id', requireAuth, asyncRoute(async (request, response) => {

  const { rows } = await pool.query(
    'SELECT r.*, s.date_heure FROM reservation r JOIN seance s ON s.id = r.seance_id WHERE r.id = $1 AND r.utilisateur_id = $2',
    [
      request.params.id,
      request.user!.id
    ]
  );

  if (
    !rows.length ||
    rows[0].statut !== 'confirmee' ||
    rows[0].date_heure <= new Date()
  ) {
    return response.status(404).json({
      error: 'Réservation introuvable ou non annulable.'
    });
  }

  const { rows: seats } = await pool.query(
    'SELECT place_seance_id FROM reservation_place WHERE reservation_id = $1 AND active = TRUE',
    [request.params.id]
  );

  await pool.query(
    "UPDATE reservation SET statut = 'annulee' WHERE id = $1",
    [request.params.id]
  );

  await pool.query(
    'UPDATE reservation_place SET active = FALSE WHERE reservation_id = $1',
    [request.params.id]
  );

  await pool.query(
    "UPDATE place_seance SET etat = 'libre' WHERE id = ANY($1::bigint[])",
    [
      seats.map(
        (seat) => seat.place_seance_id
      )
    ]
  );

  seats.forEach(({ place_seance_id }) => {
    io.to(`seance:${rows[0].seance_id}`).emit(
      'place:etat_change',
      {
        id: place_seance_id,
        etat: 'libre'
      }
    );
  });

  response.json({
    success: true
  });

}));


/* =========================
   DASHBOARD GESTIONNAIRE
========================= */

app.get('/api/gestion/dashboard', requireAuth, requireManager, asyncRoute(async (_request, response) => {

  const statsResult = await pool.query(
    `SELECT
       COALESCE((
         SELECT SUM(r.montant_total)
         FROM reservation r
         WHERE r.creee_le >= NOW() - INTERVAL '7 days'
           AND r.statut = 'confirmee'
       ), 0)::numeric AS revenus7j,

       (
         SELECT COUNT(*)
         FROM reservation_place rp
         JOIN reservation r ON r.id = rp.reservation_id
         WHERE rp.active = TRUE
           AND r.statut = 'confirmee'
       )::int AS billets_vendus,

       COALESCE((
         SELECT ROUND(
           100.0 *
           COUNT(*) FILTER (
             WHERE ps.etat = 'vendue'
               AND ps.zone <> 'bloque'
           )
           /
           NULLIF(
             COUNT(*) FILTER (
               WHERE ps.zone <> 'bloque'
             ),
             0
           )
         )
         FROM place_seance ps
       ), 0)::int AS taux_remplissage,

       (
         SELECT COUNT(*)
         FROM seance
         WHERE statut = 'ouverte'
           AND date_heure >= NOW()
       )::int AS seances_actives`
  );

  const revenueResult = await pool.query(
    `SELECT
       CASE EXTRACT(ISODOW FROM jour)
         WHEN 1 THEN 'Lun'
         WHEN 2 THEN 'Mar'
         WHEN 3 THEN 'Mer'
         WHEN 4 THEN 'Jeu'
         WHEN 5 THEN 'Ven'
         WHEN 6 THEN 'Sam'
         ELSE 'Dim'
       END AS jour,

       COALESCE(
         SUM(r.montant_total),
         0
       )::numeric AS montant

     FROM generate_series(
       CURRENT_DATE - INTERVAL '6 days',
       CURRENT_DATE,
       INTERVAL '1 day'
     ) AS jour

     LEFT JOIN reservation r
       ON DATE(r.creee_le) = DATE(jour)
       AND r.statut = 'confirmee'

     GROUP BY jour
     ORDER BY jour`
  );

  const reservationsResult = await pool.query(
    `SELECT
       r.id,
       u.nom AS client,
       f.titre AS spectacle,

       COALESCE(
         STRING_AGG(
           p.rangee || p.numero::text,
           ', '
           ORDER BY p.rangee, p.numero
         ),
         ''
       ) AS places,

       r.montant_total AS montant,
       r.statut

     FROM reservation r
     JOIN utilisateur u ON u.id = r.utilisateur_id
     JOIN seance s ON s.id = r.seance_id
     JOIN film f ON f.id = s.film_id

     LEFT JOIN reservation_place rp
       ON rp.reservation_id = r.id
       AND rp.active = TRUE

     LEFT JOIN place_seance ps
       ON ps.id = rp.place_seance_id

     LEFT JOIN place p
       ON p.id = ps.place_id

     GROUP BY
       r.id,
       u.nom,
       f.titre

     ORDER BY r.creee_le DESC
     LIMIT 5`
  );

  const sessionsResult = await pool.query(
    `SELECT
       s.id,
       f.titre,
       f.sous_titre,
       f.spectacle_type,
       s.date_heure,
       sa.nom AS salle,

       COUNT(ps.id)
         FILTER (
           WHERE ps.zone <> 'bloque'
         )::int AS capacite,

       COUNT(ps.id)
         FILTER (
           WHERE ps.etat = 'libre'
             AND ps.zone <> 'bloque'
         )::int AS disponible,

       COALESCE(
         ROUND(
           100.0 *
           COUNT(ps.id)
             FILTER (
               WHERE ps.etat = 'vendue'
                 AND ps.zone <> 'bloque'
             )
           /
           NULLIF(
             COUNT(ps.id)
               FILTER (
                 WHERE ps.zone <> 'bloque'
               ),
             0
           )
         ),
         0
       )::int AS remplissage

     FROM seance s
     JOIN film f ON f.id = s.film_id
     JOIN salle sa ON sa.id = s.salle_id
     LEFT JOIN place_seance ps ON ps.seance_id = s.id

     GROUP BY
       s.id,
       f.id,
       sa.id

     ORDER BY s.date_heure DESC
     LIMIT 20`
  );

  const stats = statsResult.rows[0];

  response.json({
    stats: {
      revenus7j: Number(stats.revenus7j),
      billetsVendus: Number(stats.billets_vendus),
      tauxRemplissage: Number(stats.taux_remplissage),
      seancesActives: Number(stats.seances_actives)
    },

    revenus: revenueResult.rows.map((row) => ({
      jour: row.jour,
      montant: Number(row.montant)
    })),

    reservations: reservationsResult.rows.map((row) => ({
      ...row,
      montant: Number(row.montant)
    })),

    seances: sessionsResult.rows.map((row) => ({
      ...row,
      capacite: Number(row.capacite),
      disponible: Number(row.disponible),
      remplissage: Number(row.remplissage)
    }))
  });

}));


/* =========================
   CRÉATION D'UNE SÉANCE
========================= */

app.post('/api/seances', requireAuth, requireManager, asyncRoute(async (request, response) => {

  const {
    titre,
    sousTitre,
    type,
    genre,
    dateHeure,
    duree,
    dureeMinutes,
    salle,
    lieu,
    imageUrl,
    rangees,
    siegesParRangee,
    plan,
    tarifs
  } = request.body;

  const starts = new Date(dateHeure);

  if (!titre?.trim() || !Number.isFinite(starts.getTime())) {
    return response.status(400).json({
      error: 'Titre et date de séance valides requis.'
    });
  }

  if (!Array.isArray(plan) || !plan.length) {
    return response.status(400).json({
      error: 'Le plan de salle est requis.'
    });
  }

  const totalRows = Number(rangees) || plan.length;
  const totalColumns = Number(siegesParRangee) || plan[0]?.length || 0;

  if (totalRows < 1 || totalColumns < 1) {
    return response.status(400).json({
      error: 'Le plan de salle est invalide.'
    });
  }

  const client = await pool.connect();

  try {

    await client.query('BEGIN');

    const film = await client.query(
      `INSERT INTO film (
        titre,
        duree_minutes,
        genre,
        image_url,
        sous_titre,
        spectacle_type
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id`,
      [
        titre.trim(),
        Number(duree ?? dureeMinutes) || 110,
        genre?.trim() || 'Cinéma',
        imageUrl?.trim() || null,
        sousTitre?.trim() || null,
        type === 'theatre' ? 'theatre' : 'cinema'
      ]
    );

    const capacite = plan
      .flat()
      .filter(
        (zone: string) => zone !== 'bloque'
      )
      .length;

    const room = await client.query(
      `INSERT INTO salle (
        nom,
        capacite,
        lieu
      )
      VALUES ($1, $2, $3)
      RETURNING id`,
      [
        salle?.trim() || 'Salle Lumière',
        capacite,
        lieu?.trim() || ''
      ]
    );

    const show = await client.query(
      'INSERT INTO seance (salle_id, film_id, date_heure) VALUES ($1, $2, $3) RETURNING id',
      [
        room.rows[0].id,
        film.rows[0].id,
        starts
      ]
    );

    for (let rowIndex = 0; rowIndex < totalRows; rowIndex += 1) {

      const row = String.fromCharCode(
        65 + rowIndex
      );

      for (let columnIndex = 0; columnIndex < totalColumns; columnIndex += 1) {

        const number = columnIndex + 1;

        const zone =
          plan[rowIndex]?.[columnIndex] ??
          'standard';

        const seat = await client.query(
          'INSERT INTO place (salle_id, rangee, numero, type) VALUES ($1, $2, $3, $4) RETURNING id',
          [
            room.rows[0].id,
            row,
            number,
            'standard'
          ]
        );

        let prix = 0;

        if (zone === 'vip') {
          prix = Number(tarifs?.vip) || 45;
        }

        if (zone === 'standard') {
          prix = Number(tarifs?.standard) || 22;
        }

        if (zone === 'economique') {
          prix = Number(tarifs?.economique) || 12;
        }

        await client.query(
          `INSERT INTO place_seance (
            place_id,
            salle_id,
            seance_id,
            etat,
            zone,
            prix
          )
          VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            seat.rows[0].id,
            room.rows[0].id,
            show.rows[0].id,
            zone === 'bloque' ? 'bloquee' : 'libre',
            zone,
            prix
          ]
        );

      }

    }

    await client.query('COMMIT');

    response.status(201).json({
      id: show.rows[0].id
    });

  } catch (error) {

    await client.query('ROLLBACK');
    throw error;

  } finally {

    client.release();

  }

}));


io.on('connection', (socket) => {

  socket.on(
    'seance:rejoindre',
    (id: string | number) =>
      socket.join(`seance:${id}`)
  );

  socket.on(
    'seance:quitter',
    (id: string | number) =>
      socket.leave(`seance:${id}`)
  );

});


app.use((error: unknown, _request: Request, response: Response, _next: NextFunction) => {

  const pgError = error as {
    code?: string;
    message?: string;
  };

  if (pgError.code === '23505') {
    return response.status(409).json({
      error: 'Cette information existe déjà.'
    });
  }

  console.error(error);

  response.status(500).json({
    error: 'Une erreur serveur est survenue.'
  });

});


async function start() {

  const sql = await readFile(
    path.resolve(
      here,
      '../database/init.sql'
    ),
    'utf8'
  );

  await pool.query(sql);

  await seed();
  await seedInitialManager();
  setInterval(async () => {

    try {

      const { rows } = await pool.query(
        `UPDATE place_seance
         SET
           etat = 'libre',
           retenue_par_utilisateur_id = NULL,
           retenue_expire_a = NULL
         WHERE
           etat = 'retenue'
           AND retenue_expire_a <= NOW()
         RETURNING id, seance_id`
      );

      rows.forEach((seat) => {

        io.to(`seance:${seat.seance_id}`).emit(
          'place:etat_change',
          {
            id: seat.id,
            etat: 'libre'
          }
        );

        io.to(`seance:${seat.seance_id}`).emit(
          'place:retenue_expiree',
          {
            id: seat.id
          }
        );

      });

    } catch (error) {

      console.error(
        'Impossible de libérer les places expirées.',
        error
      );

    }

  }, 15000).unref();


  if (process.env.NODE_ENV === 'production') {

    const clientBuild = path.resolve(
      here,
      '../dist'
    );

    app.use(
      express.static(clientBuild)
    );

    app.get(
      '*',
      (_request, response) =>
        response.sendFile(
          path.join(
            clientBuild,
            'index.html'
          )
        )
    );

  }


  httpServer.listen(
    port,
    () =>
      console.log(
        `Parterre API prête sur http://localhost:${port}`
      )
  );

}


start().catch((error) => {

  console.error(
    'Démarrage impossible. Vérifiez PostgreSQL et DATABASE_URL.',
    error
  );

  process.exit(1);

});